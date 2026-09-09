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
