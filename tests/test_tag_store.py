"""TagStore 从 advanced_data 里顺路带出中文摘要。

`abstract_zh` 不属于 tag，但 meta_json 的中文摘要就靠它：键与 tag 三段完全相同，
所以放在同一份索引里，而不是再读一遍 16k 行的 jsonl。
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.tag_store import TagStore  # noqa: E402


def write_advanced(tmp_path, publication, year, rows):
    path = tmp_path / f'{publication} - {year} - advanced.jsonl'
    with open(path, 'w', encoding='utf-8') as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
    return path


def test_abstract_zh_comes_from_advanced_rows(tmp_path):
    write_advanced(tmp_path, 'IEEE S&P', 2025, [
        {'title': 'Fuzzing the Kernel', 'title_en': 'Fuzzing the Kernel', 'abstract_zh': '  内核模糊测试。 ',
         'topics_en': ['Fuzzing'], 'categories': ['approach']},
        # 老行只有 title_en，照样对得上
        {'title_en': 'Old Row', 'abstract_zh': '旧行。', 'topics_en': [], 'categories': []},
        # 没有中文摘要的行给空串，不给 None
        {'title': 'No Chinese', 'topics_en': [], 'categories': []},
        {'title': 'Bad Type', 'abstract_zh': 12, 'topics_en': [], 'categories': []},
    ])
    store = TagStore.load(advanced_dir=str(tmp_path), cache_path=str(tmp_path / 'none.jsonl'),
                          awards_path=str(tmp_path / 'none.json'))

    assert store.abstract_zh_for('IEEE S&P', 2025, 'Fuzzing the Kernel') == '内核模糊测试。'
    assert store.abstract_zh_for('IEEE S&P', 2025, 'fuzzing the kernel!') == '内核模糊测试。'  # compact() 对齐
    assert store.abstract_zh_for('IEEE S&P', 2025, 'Old Row') == '旧行。'
    assert store.abstract_zh_for('IEEE S&P', 2025, 'No Chinese') == ''
    assert store.abstract_zh_for('IEEE S&P', 2025, 'Bad Type') == ''


def test_abstract_zh_is_empty_when_nothing_matches(tmp_path):
    store = TagStore.load(advanced_dir=str(tmp_path), cache_path=str(tmp_path / 'none.jsonl'),
                          awards_path=str(tmp_path / 'none.json'))
    assert store.abstract_zh_for('IEEE S&P', 2025, 'Unknown') == ''
    # 另一年的同名论文不能串
    write_advanced(tmp_path, 'IEEE S&P', 2024, [{'title': 'Same Title', 'abstract_zh': '去年。'}])
    store = TagStore.load(advanced_dir=str(tmp_path), cache_path=str(tmp_path / 'none.jsonl'),
                          awards_path=str(tmp_path / 'none.json'))
    assert store.abstract_zh_for('IEEE S&P', 2024, 'Same Title') == '去年。'
    assert store.abstract_zh_for('IEEE S&P', 2025, 'Same Title') == ''


# -- 奖项名 -------------------------------------------------------------------
#
# meta_json 的 `awards` 字段放 awards.json 里的原始奖项名，摘要页据此显示
# 「#Distinguished Paper Award」。tag 第 4 位只有一个字母（Best / Distinguished /
# Best Student 都折成 D），拿不回原名，所以要单独查。

def write_awards(tmp_path, data):
    path = tmp_path / 'awards.json'
    path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    return str(path)


AWARDS = [
    {'publication': 'IEEE S&P', 'awards': [
        {'name': 'Distinguished Paper Award', 'papers': [
            {'year': 2015, 'title': 'Old But Gold'},
            {'year': 2025, 'title': 'Fuzzing the Kernel'},
        ]},
        {'name': 'Best Student Paper Award', 'papers': [
            {'year': 2025, 'title': 'Fuzzing the Kernel'},
        ]},
        # 时间检验奖记的是获奖年份（2025），授予的是 2015 年的论文
        {'name': 'Test of Time Award', 'papers': [
            {'year': 2025, 'title': 'Old But Gold'},
        ]},
    ]},
    {'publication': 'NDSS', 'awards': [
        {'name': 'Best Paper Award', 'papers': [{'year': 2025, 'title': 'Fuzzing the Kernel'}]},
    ]},
]


def load_with_awards(tmp_path, data=AWARDS):
    return TagStore.load(advanced_dir=str(tmp_path), cache_path=str(tmp_path / 'none.jsonl'),
                         awards_path=write_awards(tmp_path, data))


def test_award_names_are_the_original_names_in_awards_json_order(tmp_path):
    store = load_with_awards(tmp_path)
    assert store.award_names_for('IEEE S&P', 2025, 'Fuzzing the Kernel') == [
        'Distinguished Paper Award', 'Best Student Paper Award']
    assert store.award_names_for('IEEE S&P', 2025, 'fuzzing the kernel!') == [
        'Distinguished Paper Award', 'Best Student Paper Award']  # compact() 对齐
    assert store.award_names_for('NDSS', 2025, 'Fuzzing the Kernel') == ['Best Paper Award']


def test_award_names_include_year_agnostic_test_of_time(tmp_path):
    store = load_with_awards(tmp_path)
    # 同年的奖在前，时间检验奖（按年份通配登记）在后
    assert store.award_names_for('IEEE S&P', 2015, 'Old But Gold') == [
        'Distinguished Paper Award', 'Test of Time Award']
    # 时间检验奖的「获奖年份」不是论文的发表年份：2025 年那篇同名论文（若有）不该拿到 DPA
    assert store.award_names_for('IEEE S&P', 2025, 'Old But Gold') == ['Test of Time Award']


def test_award_names_empty_when_nothing_matches(tmp_path):
    store = load_with_awards(tmp_path)
    assert store.award_names_for('IEEE S&P', 2024, 'Fuzzing the Kernel') == []
    assert store.award_names_for('ACM CCS', 2025, 'Fuzzing the Kernel') == []
    assert store.award_names_for('IEEE S&P', 2025, 'Unknown') == []


def test_award_names_are_deduplicated(tmp_path):
    # awards.json 是手工维护的，同一篇在同一奖项下录两遍不该显示两个标签
    data = [{'publication': 'NDSS', 'awards': [
        {'name': 'Best Paper Award', 'papers': [{'year': 2025, 'title': 'Dup'}, {'year': 2025, 'title': 'DUP'}]},
    ]}]
    store = load_with_awards(tmp_path, data)
    assert store.award_names_for('NDSS', 2025, 'Dup') == ['Best Paper Award']


def test_award_names_returns_a_fresh_list(tmp_path):
    store = load_with_awards(tmp_path)
    store.award_names_for('NDSS', 2025, 'Fuzzing the Kernel').append('Injected')
    assert store.award_names_for('NDSS', 2025, 'Fuzzing the Kernel') == ['Best Paper Award']


def test_award_code_agrees_with_award_names(tmp_path):
    store = load_with_awards(tmp_path)
    assert store.award_code('IEEE S&P', 2015, 'Old But Gold') == 'T'
    assert store.award_code('IEEE S&P', 2025, 'Fuzzing the Kernel') == 'D'
    assert store.award_code('IEEE S&P', 2024, 'Fuzzing the Kernel') == 'N'
