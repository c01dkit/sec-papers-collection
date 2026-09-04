"""`--llm-analyze` 的断点续跑与去重。

`official_cache/advanced_data/*.jsonl` 是追加写的：每次运行先读出文件里已经分析过的标题，
再跳过它们。这个「已分析」集合曾经有两个洞，合起来让 IEEE S&P 2026 的 199 篇攒出 433 行：

1. 只承认 `model_used == 'gemini-3-pro'` 的行（v0.3.8 遗留的 DEBUG 过滤），换模型之后
   之前所有产出都被当成没分析过，每跑一次就整份重来，中断后也无法续跑。
2. 用 LLM 自己回写的 `title_en` 原样比对源标题；模型压掉一个双空格，这篇就永远匹配不上。

现在的键是 `paper_id.compact()`（全仓库唯一的标题规范化），同时认新写入的 `title`
（源标题原文）和旧行只有的 `title_en`，不看 `model_used`。
"""

import json
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main as M  # noqa: E402
from analyzers.paper_id import compact  # noqa: E402


def _write_jsonl(path, records):
    with open(path, 'w', encoding='utf-8') as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')


def test_titles_in_file_counts_every_model(tmp_path):
    path = tmp_path / 'IEEE S&P - 2026 - advanced.jsonl'
    _write_jsonl(path, [
        {'title_en': 'Alpha', 'model_used': 'deepseek-chat'},
        {'title_en': 'Beta', 'model_used': 'gemini-3-pro'},
        {'title_en': 'Gamma', 'model_used': 'deepseek-v4-flash'},
        {'title_en': 'Delta'},  # no model_used at all: must not crash, must still count
    ])
    assert M.titles_in_file(str(path)) == {compact(t) for t in ['Alpha', 'Beta', 'Gamma', 'Delta']}


def test_titles_in_file_normalizes_like_compact(tmp_path):
    # The LLM collapsed the double space in title_en; the source title still has it.
    src = 'DY* Unchained: Now with Composable Security Proofs and Precise   Compromise Scenarios'
    path = tmp_path / 'x.jsonl'
    _write_jsonl(path, [{'title_en': ' '.join(src.split()), 'model_used': 'gemini-3-pro'}])
    assert compact(src) in M.titles_in_file(str(path))


def test_titles_in_file_uses_both_original_title_and_title_en(tmp_path):
    path = tmp_path / 'x.jsonl'
    _write_jsonl(path, [{'title': 'The Original Title', 'title_en': 'A Rewritten Title'}])
    keys = M.titles_in_file(str(path))
    assert compact('The Original Title') in keys
    assert compact('A Rewritten Title') in keys


def test_titles_in_file_missing_file_is_empty(tmp_path):
    assert M.titles_in_file(str(tmp_path / 'nope.jsonl')) == set()


def test_analyze_skips_done_papers_and_dedupes_within_run(tmp_path, monkeypatch):
    advanced_dir = tmp_path / 'advanced_data'
    advanced_dir.mkdir()
    log = advanced_dir / 'IEEE S&P - 2026 - advanced.jsonl'
    _write_jsonl(log, [
        {'title_en': 'Already Done By Deepseek', 'topics_en': ['Side channels'], 'model_used': 'deepseek-chat'},
        {'title_en': 'Whitespace Drift Paper', 'topics_en': ['Side channels'], 'model_used': 'gemini-3-pro'},
    ])
    abstract = 'a' * 80
    papers = [
        M.PaperInfo(title='Already Done By Deepseek', abstract=abstract, publication='IEEE S&P', year=2026),
        M.PaperInfo(title='Brand New Paper', abstract=abstract, publication='IEEE S&P', year=2026),
        M.PaperInfo(title='Brand New Paper', abstract=abstract, publication='IEEE S&P', year=2026),  # source dup
        M.PaperInfo(title='Whitespace   Drift Paper', abstract=abstract, publication='IEEE S&P', year=2026),
        M.PaperInfo(title='Too Short', abstract='short', publication='IEEE S&P', year=2026),
    ]

    calls = []

    def fake_analyze(title, abstract):
        calls.append(title)
        return {'title_en': title, 'topics_en': ['Web security and privacy'], 'model_used': 'fake'}

    fake_llm = types.ModuleType('analyzers.llm_analyzer')
    fake_llm.analyze_title_and_abs = fake_analyze
    monkeypatch.setitem(sys.modules, 'analyzers.llm_analyzer', fake_llm)
    monkeypatch.setattr(M, 'ADVANCED_DIR', str(advanced_dir))
    monkeypatch.setattr(M, 'get_config', lambda filename: {})
    monkeypatch.setattr(M, 'fetch_one_paper_in_config', lambda config, **kw: iter(papers))

    M.analyze_abstracts_and_titles()

    assert calls == ['Brand New Paper']
    rows = [json.loads(l) for l in log.read_text(encoding='utf-8').splitlines() if l.strip()]
    assert len(rows) == 3
    assert rows[-1]['title'] == 'Brand New Paper'   # source title is stored verbatim from now on
    assert rows[-1]['title_en'] == 'Brand New Paper'

    # Second run over the same input: nothing left to do, file untouched.
    calls.clear()
    M.analyze_abstracts_and_titles()
    assert calls == []
    assert len(log.read_text(encoding='utf-8').splitlines()) == 3
