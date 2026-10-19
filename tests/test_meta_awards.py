"""meta_json 的 `awards`：每篇论文在 awards.json 里的原始奖项名。

摘要页按它显示「#Distinguished Paper Award」这样的标签。它和摘要一样只进
meta_json —— data.json 有一万五千多行，给每行挂一个几乎总是空的数组纯属浪费。
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main as M  # noqa: E402
from analyzers.tag_store import TagStore, store_key  # noqa: E402

CONFIG = {'sp': {'name': 'IEEE S&P', 'id_prefix': 'IO', 'sites': [{'year': 2025}]}}


def fetch(monkeypatch, titles, awards):
    papers = [M.PaperInfo(title=t, publication='IEEE S&P', year=2025, paper=f'https://x/{i}')
              for i, t in enumerate(titles)]
    monkeypatch.setattr(M, 'fetch_one_edition_in_config', lambda *a, **kw: papers)
    store = TagStore(awards=awards)
    return list(M.fetch_one_paper_in_config(CONFIG, ledger={}, tag_store=store))


def test_each_paper_carries_its_award_names(monkeypatch):
    awards = {store_key('IEEE S&P', 2025, 'Winner'): ['Distinguished Paper Award', 'Best Student Paper Award']}
    winner, plain = fetch(monkeypatch, ['Winner', 'Plain'], awards)
    assert winner.awards == ['Distinguished Paper Award', 'Best Student Paper Award']
    assert winner.tag.endswith('D')   # 与 tag 第 4 位同一份名单
    assert plain.awards == []


def test_awards_go_to_meta_json_but_not_to_list_records():
    info = M.PaperInfo(id='IO25001', title='Winner', abstract='en', abstract_zh='中',
                       awards=['Distinguished Paper Award'])
    record = M.list_record(info)
    for key in ('abstract', 'abstract_zh', 'awards'):
        assert key not in record
    assert record['id'] == 'IO25001' and record['title'] == 'Winner'
    assert M.asdict(info)['awards'] == ['Distinguished Paper Award']


def test_paper_info_awards_default_is_not_shared():
    a, b = M.PaperInfo(), M.PaperInfo()
    a.awards.append('X')
    assert b.awards == []
