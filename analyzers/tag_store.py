"""`tag` 的三个数据源，合并成一次查表。

规则文档：`docs/id-rule.md` 第 2 节。

来源与优先级：

| 段 | 来源 |
| --- | --- |
| 类型 t[0] | 标题 `SoK` 前缀 > `tag_cache.jsonl`（LLM） > `advanced_data` 的 `categories` > 标题 `survey` |
| topic t[1:2] | `tag_cache.jsonl`（LLM） > `advanced_data` 的 `topics_en[0]` |
| 奖项 t[3] | `awards.json`，不需要 LLM |

`advanced_data/*.jsonl` 是 `--llm-analyze` 已经攒下的 11269 条产出，其中 95.4% 能按
`compact(title)` 对上现有论文 —— 白拿的存量，先榨干它再考虑发请求。
"""

from __future__ import annotations

import glob
import json
import os
import re

from analyzers import id_taxonomy as taxonomy
from analyzers.paper_id import build_tag, compact

ADVANCED_DIR = os.path.join('official_cache', 'advanced_data')
CACHE_PATH = os.path.join('official_cache', 'tag_cache.jsonl')
AWARDS_PATH = os.path.join('src', 'assets', 'data', 'awards.json')

DEFAULT_TAG = '000N'

#: 年份通配的占位符，用于 `YEAR_AGNOSTIC_AWARDS`。真实年份都是数字，不会撞。
ANY_YEAR = '*'

#: 标题以 SoK 开头。`SoK:` / `SoK -` / `SOK ` 都算。
_SOK_RE = re.compile(r'^\s*sok\b', re.IGNORECASE)
#: 独立的 survey 一词，避免 "SurveyLance" 这种误命中。
_SURVEY_RE = re.compile(r'\bsurveys?\b', re.IGNORECASE)


def store_key(publication: str, year, title: str) -> str:
    """三个来源统一的键。"""
    return f'{publication}|{year}|{compact(title)}'


def type_from_title(title: str) -> str:
    """只看标题能得出的类型码；得不出给 `0`。"""
    if _SOK_RE.match(title or ''):
        return taxonomy.TYPE_CODES['sok']
    return taxonomy.TYPE_UNANALYZED


def _iter_jsonl(path: str):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


class TagStore:
    """按 `(publication, year, compact(title))` 查 tag 的三个组成部分。"""

    def __init__(self, advanced=None, cached=None, awards=None):
        self.advanced: dict[str, dict] = advanced or {}
        self.cached: dict[str, dict] = cached or {}
        self.awards: dict[str, str] = awards or {}

    # -- 加载 ---------------------------------------------------------------

    @classmethod
    def load(cls, advanced_dir=ADVANCED_DIR, cache_path=CACHE_PATH, awards_path=AWARDS_PATH):
        return cls(
            advanced=cls._load_advanced(advanced_dir),
            cached=cls._load_cache(cache_path),
            awards=cls._load_awards(awards_path),
        )

    @staticmethod
    def _load_advanced(directory: str) -> dict[str, dict]:
        """读 `--llm-analyze` 的存量产出。文件名形如 `ACM CCS - 2024 - advanced.jsonl`。"""
        result: dict[str, dict] = {}
        for path in sorted(glob.glob(os.path.join(directory, '*.jsonl'))):
            base = os.path.basename(path)
            stem = base[:-len(' - advanced.jsonl')] if base.endswith(' - advanced.jsonl') else base
            if ' - ' not in stem:
                continue
            publication, year = stem.rsplit(' - ', 1)
            for record in _iter_jsonl(path):
                title = record.get('title_en') or record.get('title')
                if not title:
                    continue
                topics = record.get('topics_en') or []
                if isinstance(topics, str):
                    topics = [topics]
                result[store_key(publication, year, title)] = {
                    'topic': taxonomy.topic_code(topics[0]) if topics else taxonomy.TOPIC_UNCLASSIFIED,
                    'type': taxonomy.type_code_from_categories(record.get('categories')),
                }
        return result

    @staticmethod
    def _load_cache(path: str) -> dict[str, dict]:
        """读 `--llm-tag` 的产出。后写的覆盖先写的（同一 key 重复时取最后一条）。"""
        result: dict[str, dict] = {}
        for record in _iter_jsonl(path):
            key = record.get('key')
            if not key:
                continue
            result[key] = {
                'topic': record.get('topic', taxonomy.TOPIC_UNCLASSIFIED),
                'type': record.get('type', taxonomy.TYPE_UNANALYZED),
            }
        return result

    @staticmethod
    def _load_awards(path: str) -> dict[str, list[str]]:
        """读 `awards.json`，返回 键 -> 奖项名列表。

        `YEAR_AGNOSTIC_AWARDS` 里的奖项用年份通配的键登记：它们在 `awards.json`
        里记的是获奖年份而非论文发表年份，按年份对齐会全部落空。
        """
        if not os.path.exists(path):
            return {}
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        names: dict[str, list[str]] = {}
        for conference in data:
            publication = conference.get('publication')
            for award in conference.get('awards', []):
                year_agnostic = award['name'] in taxonomy.YEAR_AGNOSTIC_AWARDS
                for paper in award.get('papers', []):
                    year = ANY_YEAR if year_agnostic else paper.get('year')
                    key = store_key(publication, year, paper.get('title', ''))
                    names.setdefault(key, []).append(award['name'])
        return names

    # -- 查表 ---------------------------------------------------------------

    def type_code(self, publication: str, year, title: str) -> str:
        if _SOK_RE.match(title or ''):
            return taxonomy.TYPE_CODES['sok']

        key = store_key(publication, year, title)
        cached = self.cached.get(key, {}).get('type', taxonomy.TYPE_UNANALYZED)
        if cached != taxonomy.TYPE_UNANALYZED:
            return cached

        advanced = self.advanced.get(key, {}).get('type', taxonomy.TYPE_UNANALYZED)
        if advanced != taxonomy.TYPE_UNANALYZED:
            return advanced

        if _SURVEY_RE.search(title or ''):
            return taxonomy.TYPE_CODES['survey']
        return taxonomy.TYPE_UNANALYZED

    def topic_code(self, publication: str, year, title: str) -> str:
        key = store_key(publication, year, title)
        cached = self.cached.get(key, {}).get('topic', taxonomy.TOPIC_UNCLASSIFIED)
        if cached != taxonomy.TOPIC_UNCLASSIFIED:
            return cached
        return self.advanced.get(key, {}).get('topic', taxonomy.TOPIC_UNCLASSIFIED)

    def award_code(self, publication: str, year, title: str) -> str:
        """按发表年份和年份通配两个键各查一次，合并后取优先级最高的。

        一篇 2015 年的论文可能既有当年的杰出论文奖，又在 2025 年拿到时间检验奖。
        """
        names = list(self.awards.get(store_key(publication, year, title), ()))
        names += self.awards.get(store_key(publication, ANY_YEAR, title), ())
        return taxonomy.award_code(names)

    def tag_for(self, publication: str, year, title: str) -> str:
        return build_tag(
            self.type_code(publication, year, title),
            self.topic_code(publication, year, title),
            self.award_code(publication, year, title),
        )

    def needs_llm(self, publication: str, year, title: str) -> bool:
        """静态来源填不满的论文，才值得为它发一次 LLM 请求。"""
        return (
            self.type_code(publication, year, title) == taxonomy.TYPE_UNANALYZED
            or self.topic_code(publication, year, title) == taxonomy.TOPIC_UNCLASSIFIED
        )
