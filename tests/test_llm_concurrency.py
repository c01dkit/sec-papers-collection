"""`--llm-analyze` / `--llm-tag` 的并发请求。

两条命令都把待请求论文交给 `main.run_concurrently()` 的线程池（默认 `LLM_CONCURRENCY`
= 8 路，`--llm-concurrency` 可改），结果回到调用线程再写 JSONL —— 写文件始终单线程，
不用加锁。这里锁住四件事：真的并发、不超过上限、异常各归各篇、调用方出错时排队中的
请求被取消而不是在退出前悄悄跑完。
"""

import json
import os
import sys
import threading
import time
import types

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main as M  # noqa: E402


def test_default_concurrency_is_8():
    assert M.LLM_CONCURRENCY == 8


def test_requests_actually_overlap():
    # Four calls that each wait for all four to arrive: a sequential loop would time out.
    barrier = threading.Barrier(4, timeout=5)

    def fn(item):
        barrier.wait()
        return item * 10

    got = {item: future.result() for item, future in M.run_concurrently([1, 2, 3, 4], fn, 4)}
    assert got == {1: 10, 2: 20, 3: 30, 4: 40}


def test_never_exceeds_the_worker_cap():
    lock = threading.Lock()
    live = peak = 0

    def fn(item):
        nonlocal live, peak
        with lock:
            live += 1
            peak = max(peak, live)
        time.sleep(0.02)
        with lock:
            live -= 1
        return item

    done = [item for item, future in M.run_concurrently(range(20), fn, 3) if future.result() is not None]
    assert sorted(done) == list(range(20))
    assert peak == 3


def test_one_failure_does_not_sink_the_others():
    def fn(item):
        if item == 2:
            raise RuntimeError('boom')
        return item

    ok, failed = [], []
    for item, future in M.run_concurrently([1, 2, 3], fn, 2):
        try:
            ok.append(future.result())
        except RuntimeError:
            failed.append(item)
    assert sorted(ok) == [1, 3]
    assert failed == [2]


def test_caller_error_cancels_queued_requests():
    started = []
    release = threading.Event()

    def fn(item):
        started.append(item)
        if item != 0:
            release.wait(5)   # item 0 returns at once so the caller gets a future to choke on
        return item

    with pytest.raises(KeyError):
        for _item, future in M.run_concurrently(range(10), fn, 2):
            raise KeyError('caller blew up')   # e.g. a disk error while appending the row
    release.set()
    time.sleep(0.1)  # give any (wrongly) surviving queued item a chance to start
    assert set(started) <= {0, 1, 2}   # 0 done, ≤ 2 in flight when the error hit; 3..9 never run


def test_rejects_zero_workers():
    with pytest.raises(ValueError):
        list(M.run_concurrently([1], lambda x: x, 0))


def test_cli_concurrency_must_be_positive():
    import argparse
    with pytest.raises(argparse.ArgumentTypeError):
        M.positive_int('0')
    assert M.positive_int('16') == 16


def test_llm_analyze_writes_every_result_under_concurrency(tmp_path, monkeypatch):
    advanced_dir = tmp_path / 'advanced_data'
    abstract = 'a' * 80
    titles = [f'Paper {i}' for i in range(12)]
    papers = [M.PaperInfo(title=t, abstract=abstract, publication='IEEE S&P', year=2026) for t in titles]
    seen_threads = set()

    def fake_analyze(title, abstract):
        seen_threads.add(threading.get_ident())
        time.sleep(0.01)
        if title == 'Paper 5':
            raise RuntimeError('rate limited')
        return {'title_en': title, 'topics_en': ['Side channels'], 'model_used': 'fake'}

    fake_llm = types.ModuleType('analyzers.llm_analyzer')
    fake_llm.analyze_title_and_abs = fake_analyze
    monkeypatch.setitem(sys.modules, 'analyzers.llm_analyzer', fake_llm)
    monkeypatch.setattr(M, 'ADVANCED_DIR', str(advanced_dir))
    monkeypatch.setattr(M, 'get_config', lambda filename: {})
    monkeypatch.setattr(M, 'fetch_one_paper_in_config', lambda config, **kw: iter(papers))

    M.analyze_abstracts_and_titles(concurrency=4)

    log = advanced_dir / 'IEEE S&P - 2026 - advanced.jsonl'
    rows = [json.loads(l) for l in log.read_text(encoding='utf-8').splitlines() if l.strip()]
    assert sorted(r['title'] for r in rows) == sorted(t for t in titles if t != 'Paper 5')
    assert len(seen_threads) > 1


def test_llm_tag_writes_every_result_under_concurrency(tmp_path, monkeypatch):
    from analyzers import tag_analyzer
    from analyzers import tag_store as tag_store_mod

    cache = tmp_path / 'tag_cache.jsonl'
    abstract = 'a' * 80
    titles = [f'Paper {i}' for i in range(10)]
    papers = [M.PaperInfo(title=t, abstract=abstract, publication='IEEE S&P', year=2026) for t in titles]
    calls = []

    class FakeStore:
        def needs_llm(self, publication, year, title):
            return True

    def fake_analyze_one(title, abstract):
        calls.append(title)
        time.sleep(0.01)
        if title == 'Paper 3':
            raise RuntimeError('LLM request failed')
        return '1', '21'

    real_append = tag_analyzer.append_result
    monkeypatch.setattr(tag_store_mod.TagStore, 'load', classmethod(lambda cls, *a, **kw: FakeStore()))
    monkeypatch.setattr(tag_analyzer, 'cached_keys', lambda *a, **kw: set())
    monkeypatch.setattr(tag_analyzer, 'analyze_one', fake_analyze_one)
    monkeypatch.setattr(tag_analyzer, 'append_result',
                        lambda *a, **kw: real_append(*a, path=str(cache), **kw))
    monkeypatch.setattr(M.paper_id, 'load_ledger', lambda *a, **kw: {})
    monkeypatch.setattr(M, 'get_config', lambda filename: {})
    monkeypatch.setattr(M, 'fetch_one_paper_in_config', lambda config, **kw: iter(papers))

    M.analyze_tags_with_llm(limit=8, concurrency=4)

    assert sorted(calls) == sorted(titles[:8])   # --llm-tag-limit still caps the requests
    rows = [json.loads(l) for l in cache.read_text(encoding='utf-8').splitlines() if l.strip()]
    assert sorted(r['title'] for r in rows) == sorted(t for t in titles[:8] if t != 'Paper 3')
    assert all(r['type'] == '1' and r['topic'] == '21' for r in rows)
