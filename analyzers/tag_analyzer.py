"""用 LLM 补全静态阶段填不出的 `tag` 位。

入口是 `uv run main.py --llm-tag`。

先便宜的：`tag_store.TagStore` 已经从 `advanced_data/*.jsonl` 白拿了 11269 条存量
产出，本脚本只对**它填不满的论文**发请求（`TagStore.needs_llm`）。

模型返回的是 topic 的**名称**而不是十六进制码。让模型在 198 项的码表里查码，等于
要求它做一次无差错的表查找 —— 它做不好，而 `id_taxonomy.topic_code()` 本地查表是
零成本且精确的，别名表还顺带兜住近似写法。类型同理，返回标签而非数字。

产出写 `official_cache/tag_cache.jsonl`，一行一条，可断点续跑。
"""

from __future__ import annotations

import datetime
import json
import os

from analyzers import id_taxonomy as taxonomy
from analyzers.tag_store import CACHE_PATH, store_key

#: 模型可选的类型标签 -> 码。与 docs/id-rule.md 第 2.1 节一致。
_TYPE_LABELS: dict[str, str] = {
    'method design': '1',
    'measurement': '2',
    'benchmark': '3',
    'dataset': '4',
    'survey': '5',
    'sok': '6',
    'user study': '7',
    'other': taxonomy.TYPE_OTHER,
}

_TYPE_GUIDE = """Paper type -- pick exactly one label:
  method design  a new technique/tool/system that solves a stated problem
  measurement    an empirical study of something in the wild
  benchmark      the contribution is a benchmark suite or evaluation harness
  dataset        the contribution is a dataset
  survey         a literature survey
  sok            a systematization of knowledge
  user study     humans are the subject: interviews, surveys of people, lab studies
  other          none of the above"""


def _topic_guide() -> str:
    """按段列出全部 topic 名称。三段的边界对模型是有用的上下文。"""
    by_band: dict[str, list[str]] = {}
    for name, code in taxonomy.TOPIC_CODES.items():
        by_band.setdefault(taxonomy.band_of(code) or 'other', []).append(name)
    parts = ['Topic -- pick exactly one name, copied verbatim from this list:']
    for band in ('security', 'software-engineering', 'system'):
        parts.append(f'\n[{band}]')
        parts.extend(f'  {name}' for name in by_band.get(band, []))
    parts.append('\nIf genuinely none of them fit, answer exactly: Other')
    return '\n'.join(parts)


def _system_message() -> str:
    return (
        'You classify papers from top-tier computer security, software engineering '
        'and systems venues. Given a title and abstract, reply with ONLY a JSON '
        'object of the form {"type": "<label>", "topic": "<name>"}.\n\n'
        + _TYPE_GUIDE + '\n\n' + _topic_guide()
    )


_client = None


def _get_client():
    """延迟建 client：没有 API key 时 `import` 本模块不该炸。"""
    global _client
    if _client is None:
        from openai import OpenAI

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise EnvironmentError('OPENAI_API_KEY is not set; --llm-tag needs it in .env')
        _client = OpenAI(api_key=api_key, base_url=os.getenv('BASE_URL', 'https://api.openai.com/v1'))
    return _client


def _coerce(payload: dict) -> tuple[str, str]:
    """模型输出 -> (类型码, topic 码)。认不出的分别落 `0` / `00`，由调用方决定是否重试。"""
    raw_type = taxonomy.normalize(payload.get('type', ''))
    raw_topic = str(payload.get('topic', '')).strip()
    type_code = _TYPE_LABELS.get(raw_type, taxonomy.TYPE_UNANALYZED)
    topic_code = taxonomy.topic_code(raw_topic)
    return type_code, topic_code


def _ask(title: str, abstract: str) -> dict:
    from analyzers.llm_analyzer import extract_json_from_content_safe

    completion = _get_client().chat.completions.create(
        model=os.getenv('MODEL', 'gpt-4o-mini'),
        messages=[
            {'role': 'system', 'content': _system_message()},
            {'role': 'user', 'content': f'Title:\n{title}\n\nAbstract:\n{abstract}'},
        ],
        temperature=1,
    )
    content = completion.choices[0].message.content or ''
    return extract_json_from_content_safe(content)


def analyze_one(title: str, abstract: str, attempts: int = 2) -> tuple[str, str]:
    """返回 (类型码, topic 码)。

    重试 `attempts` 次仍拿不到合法值时，落 `9`（不属于任何分类）/ `FF`（同）——
    而不是留 `0` / `00`。留默认值的话下次跑还会再问一遍同一篇，永远收敛不了。
    """
    type_code = taxonomy.TYPE_UNANALYZED
    topic_code = taxonomy.TOPIC_UNCLASSIFIED
    for _ in range(attempts):
        try:
            payload = _ask(title, abstract)
        except Exception as exc:  # 网络/额度问题：交给调用方决定跳过还是中止
            raise RuntimeError(f'LLM request failed: {exc}') from exc
        got_type, got_topic = _coerce(payload)
        type_code = got_type if got_type != taxonomy.TYPE_UNANALYZED else type_code
        topic_code = got_topic if got_topic != taxonomy.TOPIC_UNCLASSIFIED else topic_code
        if type_code != taxonomy.TYPE_UNANALYZED and topic_code != taxonomy.TOPIC_UNCLASSIFIED:
            break
    if type_code == taxonomy.TYPE_UNANALYZED:
        type_code = taxonomy.TYPE_OTHER
    if topic_code == taxonomy.TOPIC_UNCLASSIFIED:
        topic_code = taxonomy.TOPIC_OTHER
    return type_code, topic_code


def cached_keys(path: str = CACHE_PATH) -> set[str]:
    """已经问过的论文，跳过。"""
    keys: set[str] = set()
    if not os.path.exists(path):
        return keys
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                key = json.loads(line).get('key')
            except json.JSONDecodeError:
                continue
            if key:
                keys.add(key)
    return keys


def append_result(publication, year, title, type_code, topic_code, path: str = CACHE_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    record = {
        'key': store_key(publication, year, title),
        'title': title,
        'type': type_code,
        'topic': topic_code,
        'source': 'llm',
        'model': os.getenv('MODEL', 'gpt-4o-mini'),
        'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }
    with open(path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(record, ensure_ascii=False) + '\n')
        f.flush()
    return record
