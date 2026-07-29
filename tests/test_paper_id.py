"""台账分配的不变式。

本文件里最重要的是 `test_inserting_a_paper_leaves_every_other_id_untouched` ——
那条断言就是整个改造的目的。旧方案用一个跨全部会议的全局计数器，往任何一个会议加
一年数据，其后所有论文的 ID 都平移，134 个 meta_json 全部变更、全量重传 26MB。
"""

import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers import paper_id as P  # noqa: E402


def edition(*titles):
    """把标题列表变成 (title, url) 序列，URL 由标题派生。"""
    return [(t, f'https://example.org/{t.lower().replace(" ", "-")}') for t in titles]


# --------------------------------------------------------------------------
# compact
# --------------------------------------------------------------------------

def test_compact_strips_everything_but_alphanumerics():
    assert P.compact('SoK: A Study of C++ Templates!') == 'sokastudyofctemplates'
    assert P.compact('  Spaces\tand\nnewlines  ') == 'spacesandnewlines'
    assert P.compact('') == ''


def test_compact_matches_the_definition_main_py_used():
    # main.py 原先的实现，此处作为回归基准
    def old(title):
        return ''.join(c for c in title if c.isalnum()).lower()

    for s in ['DRAWN APART: A Device Identification Technique', 'Über-Fuzzing 2.0', '中文标题']:
        assert P.compact(s) == old(s)


# --------------------------------------------------------------------------
# build_id / parse_id / build_tag
# --------------------------------------------------------------------------

def test_build_id_shape():
    assert P.build_id('IO', 2025, 1) == 'IO25001'
    assert P.build_id('OO', 1994, 47) == 'OO94047'
    assert P.build_id('IU', 2026, 999) == 'IU26999'


def test_build_id_rejects_bad_input():
    with pytest.raises(ValueError, match='id_prefix'):
        P.build_id('i0', 2025, 1)
    with pytest.raises(ValueError, match='id_prefix'):
        P.build_id('IOX', 2025, 1)
    with pytest.raises(ValueError, match='年份'):
        P.build_id('IO', 1899, 1)
    with pytest.raises(ValueError, match='序号'):
        P.build_id('IO', 2025, 0)
    with pytest.raises(ValueError, match='序号'):
        P.build_id('IO', 2025, 1000)


def test_parse_id_roundtrip():
    for prefix, year, seq in [('IO', 2025, 1), ('OO', 1994, 47), ('SF', 2015, 999)]:
        parsed = P.parse_id(P.build_id(prefix, year, seq))
        assert parsed.prefix == prefix
        assert parsed.year2 == f'{year % 100:02d}'
        assert parsed.seq == seq


def test_parse_id_rejects_garbage():
    for bad in ['', 'IO2500', 'IO250011', 'io25001', '1225001', None]:
        with pytest.raises(ValueError):
            P.parse_id(bad)


def test_build_tag():
    assert P.build_tag('1', 'A3', 'N') == '1A3N'
    assert P.build_tag('0', '00', 'N') == '000N'
    with pytest.raises(ValueError, match='类型码'):
        P.build_tag('x', '00', 'N')
    with pytest.raises(ValueError, match='topic'):
        P.build_tag('0', 'ZZ', 'N')
    with pytest.raises(ValueError, match='奖项码'):
        P.build_tag('0', '00', 'Q')


# --------------------------------------------------------------------------
# collect_prefixes
# --------------------------------------------------------------------------

def test_collect_prefixes_happy_path():
    config = {
        'oakland': {'name': 'IEEE S&P', 'id_prefix': 'IO'},
        'ccs': {'name': 'ACM CCS', 'id_prefix': 'IC'},
    }
    assert P.collect_prefixes(config) == {'IEEE S&P': 'IO', 'ACM CCS': 'IC'}


def test_collect_prefixes_rejects_missing():
    config = {'oakland': {'name': 'IEEE S&P', 'id_prefix': 'IO'}, 'ccs': {'name': 'ACM CCS'}}
    with pytest.raises(ValueError, match='缺少 id_prefix'):
        P.collect_prefixes(config)


def test_collect_prefixes_rejects_collision():
    config = {
        'oakland': {'name': 'IEEE S&P', 'id_prefix': 'IO'},
        'osdi': {'name': 'OSDI', 'id_prefix': 'IO'},
    }
    with pytest.raises(ValueError, match='同时使用'):
        P.collect_prefixes(config)


def test_collect_prefixes_rejects_malformed():
    with pytest.raises(ValueError, match='2 个大写字母'):
        P.collect_prefixes({'x': {'name': 'X', 'id_prefix': 'io'}})


# --------------------------------------------------------------------------
# assign_seq —— 核心不变式
# --------------------------------------------------------------------------

def test_assignment_is_deterministic():
    papers = edition('Bravo', 'Alpha', 'Charlie')
    a, b = {}, {}
    assert P.assign_seq(a, 'IEEE S&P', 2025, papers) == P.assign_seq(b, 'IEEE S&P', 2025, papers)
    assert a == b


def test_assignment_follows_sorted_title_order_on_a_fresh_ledger():
    ledger = {}
    seqs = P.assign_seq(ledger, 'IEEE S&P', 2025, edition('Bravo', 'Alpha', 'Charlie'))
    # 输入顺序 Bravo/Alpha/Charlie，但分号按 compact(title) 升序
    assert seqs == [2, 1, 3]


def test_assignment_is_independent_of_input_order():
    forward = P.assign_seq({}, 'IEEE S&P', 2025, edition('Alpha', 'Bravo', 'Charlie'))
    reverse = P.assign_seq({}, 'IEEE S&P', 2025, edition('Charlie', 'Bravo', 'Alpha'))
    assert forward == [1, 2, 3]
    assert reverse == [3, 2, 1]


def test_inserting_a_paper_leaves_every_other_id_untouched():
    """本次改造的全部意义所在。

    往一个已定稿的场次补录一篇论文 —— 而且是按字典序排在最前面的那种，旧方案下
    最坏的情况 —— 其余每一篇的 ID 都必须纹丝不动。
    """
    ledger = {}
    original = edition('Bravo', 'Charlie', 'Delta')
    first = P.assign_ids(ledger, 'IU', 'USENIX Sec', 2025, original)

    # "Alpha" 排在所有已有论文之前
    augmented = edition('Alpha', 'Bravo', 'Charlie', 'Delta')
    second = P.assign_ids(ledger, 'IU', 'USENIX Sec', 2025, augmented)

    assert second[1:] == first, '补录一篇后其余论文的 ID 发生了变化'
    assert second[0] == 'IU25004', '新论文应拿到下一个未使用的号'


def test_removing_a_paper_leaves_every_other_id_untouched():
    ledger = {}
    first = P.assign_ids(ledger, 'IU', 'USENIX Sec', 2025, edition('Alpha', 'Bravo', 'Charlie'))
    # 中间那篇被数据源删掉了
    second = P.assign_ids(ledger, 'IU', 'USENIX Sec', 2025, edition('Alpha', 'Charlie'))
    assert second == [first[0], first[2]]


def test_reassigning_after_removal_does_not_recycle_the_freed_number():
    ledger = {}
    P.assign_seq(ledger, 'USENIX Sec', 2025, edition('Alpha', 'Bravo', 'Charlie'))
    P.assign_seq(ledger, 'USENIX Sec', 2025, edition('Alpha', 'Charlie'))
    # Bravo 的 2 号是孤儿，但仍占位；新论文取 4 而不是 2
    seqs = P.assign_seq(ledger, 'USENIX Sec', 2025, edition('Alpha', 'Charlie', 'Zulu'))
    assert seqs == [1, 3, 4]


def test_editions_are_numbered_independently():
    ledger = {}
    a = P.assign_seq(ledger, 'IEEE S&P', 2025, edition('Alpha', 'Bravo'))
    b = P.assign_seq(ledger, 'ACM CCS', 2025, edition('Charlie', 'Delta'))
    c = P.assign_seq(ledger, 'IEEE S&P', 2024, edition('Echo',))
    assert a == [1, 2] and b == [1, 2] and c == [1]


# --------------------------------------------------------------------------
# 重名与 URL 变化 —— 真实数据里存在的两种情况
# --------------------------------------------------------------------------

def test_same_title_different_urls_get_distinct_numbers():
    """USENIX Sec 2026 有 4 篇标题都是 "Paper Title Under Embargo"。"""
    papers = [
        ('Paper Title Under Embargo', 'https://usenix.org/…/shen'),
        ('Paper Title Under Embargo', 'https://usenix.org/…/hetter'),
        ('Paper Title Under Embargo', 'https://usenix.org/…/crow'),
        ('Paper Title Under Embargo', 'https://usenix.org/…/schl'),
    ]
    seqs = P.assign_seq({}, 'USENIX Sec', 2026, papers)
    assert sorted(seqs) == [1, 2, 3, 4]


def test_same_title_papers_keep_their_numbers_across_runs():
    papers = [
        ('Paper Title Under Embargo', 'https://usenix.org/…/shen'),
        ('Paper Title Under Embargo', 'https://usenix.org/…/hetter'),
    ]
    ledger = {}
    first = P.assign_seq(ledger, 'USENIX Sec', 2026, papers)
    second = P.assign_seq(ledger, 'USENIX Sec', 2026, papers)
    assert first == second


def test_url_change_does_not_change_the_id():
    """NDSS 会把 auto-draft-242 这类占位 URL 改成正式 slug。标题键先命中，ID 不变。"""
    ledger = {}
    before = P.assign_ids(ledger, 'IN', 'NDSS', 2022, [
        ('DRAWN APART', 'https://ndss-symposium.org/ndss-paper/auto-draft-242/'),
    ])
    after = P.assign_ids(ledger, 'IN', 'NDSS', 2022, [
        ('DRAWN APART', 'https://ndss-symposium.org/ndss-paper/drawn-apart/'),
    ])
    assert before == after


def test_identical_title_and_url_still_gets_distinct_stable_numbers():
    """脏数据（标题与 URL 都相同）不该让构建停下来，但也不能撞号。

    数字后缀兜底，且跨轮次稳定。真正的去重靠 `--check-titles`。
    """
    papers = [('Same', 'https://x/y')] * 3
    ledger = {}
    first = P.assign_seq(ledger, 'IEEE S&P', 2025, papers)
    assert sorted(first) == [1, 2, 3]
    assert P.assign_seq(ledger, 'IEEE S&P', 2025, papers) == first


def test_papers_without_a_url_still_get_numbers():
    seqs = P.assign_seq({}, 'SOSP', 2001, [('Alpha', ''), ('Bravo', '#')])
    assert sorted(seqs) == [1, 2]


# --------------------------------------------------------------------------
# 边界
# --------------------------------------------------------------------------

def test_sequence_999_is_allowed():
    papers = edition(*[f'Paper {i:04d}' for i in range(999)])
    seqs = P.assign_seq({}, 'USENIX Sec', 2025, papers)
    assert max(seqs) == 999


def test_sequence_1000_raises_rather_than_truncating():
    papers = edition(*[f'Paper {i:04d}' for i in range(1000)])
    with pytest.raises(ValueError, match='超过上限'):
        P.assign_seq({}, 'USENIX Sec', 2025, papers)


# --------------------------------------------------------------------------
# 台账文件
# --------------------------------------------------------------------------

def test_load_ledger_returns_empty_when_file_is_absent(tmp_path):
    assert P.load_ledger(str(tmp_path / 'nope.json')) == {}


def test_load_ledger_refuses_to_swallow_a_corrupt_file(tmp_path):
    path = tmp_path / 'id_ledger.json'
    path.write_text('{ not json', encoding='utf-8')
    with pytest.raises(ValueError, match='解析失败'):
        P.load_ledger(str(path))


def test_load_ledger_rejects_duplicate_sequence_numbers(tmp_path):
    path = tmp_path / 'id_ledger.json'
    path.write_text(json.dumps({'IEEE S&P': {'2025': {'a': 1, 'b': 1}}}), encoding='utf-8')
    with pytest.raises(ValueError, match='重复序号'):
        P.load_ledger(str(path))


def test_ledger_roundtrip(tmp_path):
    path = str(tmp_path / 'id_ledger.json')
    ledger = {}
    P.assign_seq(ledger, 'IEEE S&P', 2025, edition('Alpha', 'Bravo'))
    P.save_ledger(ledger, path)
    assert P.load_ledger(path) == ledger


def test_saved_ledger_is_key_sorted_so_diffs_stay_clean(tmp_path):
    path = str(tmp_path / 'id_ledger.json')
    ledger = {}
    P.assign_seq(ledger, 'IEEE S&P', 2025, edition('Zulu', 'Alpha'))
    P.assign_seq(ledger, 'ACM CCS', 2025, edition('Mike',))
    P.save_ledger(ledger, path)
    text = open(path, encoding='utf-8').read()
    assert text.index('"ACM CCS"') < text.index('"IEEE S&P"')
    assert text.endswith('\n')


def test_ledger_stats():
    ledger = {}
    P.assign_seq(ledger, 'IEEE S&P', 2025, edition('Alpha', 'Bravo'))
    P.assign_seq(ledger, 'IEEE S&P', 2024, edition('Charlie',))
    P.assign_seq(ledger, 'ACM CCS', 2025, edition('Delta',))
    assert P.ledger_stats(ledger) == {'publications': 2, 'editions': 3, 'entries': 4}
