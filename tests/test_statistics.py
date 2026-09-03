"""data-statistics.json 里按 tag 计数的两张表。

主题索引页与检索页的下拉都从它们取篇数，所以计数必须和 data.json 里的 tag 严格对上，
畸形 tag 也要落到默认码而不是被跳过 —— 否则 byTopic 合计会小于 total。
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main as M  # noqa: E402


def test_tally_tag_counts_type_and_topic():
    s = M.Statistics()
    for tag in ['123N', '132D', '6FFN', '123N']:
        M.tally_tag(s, tag)
    assert s.byType == {'1': 3, '6': 1}
    assert s.byTopic == {'23': 2, '32': 1, 'FF': 1}


def test_tally_tag_treats_malformed_tag_as_default():
    s = M.Statistics()
    for tag in ['', None, 'bad', '12345']:
        M.tally_tag(s, tag)
    assert s.byType == {'0': 4}
    assert s.byTopic == {'00': 4}


def test_statistics_has_the_two_new_tables_by_default():
    s = M.Statistics()
    assert s.byTopic == {} and s.byType == {}
