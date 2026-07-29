"""论文 ID 的分配与编码。

规则文档：`docs/id-rule.md`。

`id` 是 7 字符的**永久**标识（领域 + 会议 + 年份 + 场内序号），`tag` 是 4 字符的
可变标签（类型 + topic + 奖项）。拆开是因为 `id` 同时是 IndexedDB `favorites` 的
主键和 `meta_json` 增量上传的稳定性来源 —— 把随分析变化的属性编进去，等于每跑一轮
LLM 就让用户的收藏失效、让文件重传。

场内序号由仓库根目录的 `id_ledger.json` 固定，一旦分配永不改变。台账**必须进 git**：
`official_cache/` 被 `.gitignore` 忽略，放那里等于换台机器就重算。
"""

from __future__ import annotations

import json
import os
import re
from typing import Iterable, NamedTuple, Sequence

LEDGER_PATH = 'id_ledger.json'

MAX_SEQ = 999
MIN_YEAR = 1900
MAX_YEAR = 2099

_PREFIX_RE = re.compile(r'^[A-Z]{2}$')
_ID_RE = re.compile(r'^([A-Z]{2})(\d{2})(\d{3})$')


def compact(text: str) -> str:
    """标题/URL 的规范化形式：去掉所有非字母数字字符后转小写。

    这是全仓库唯一的实现 —— `main.py` 与各 analyzer 都从这里导入。台账的键就是它，
    改动定义会让全站 ID 重新洗牌。
    """
    return ''.join(c for c in str(text) if c.isalnum()).lower()


# --------------------------------------------------------------------------
# 编码 / 解码
# --------------------------------------------------------------------------

class ParsedId(NamedTuple):
    prefix: str
    year2: str
    seq: int


def build_id(prefix: str, year: int, seq: int) -> str:
    """`'IO'`, 2025, 1 -> `'IO25001'`。"""
    if not _PREFIX_RE.match(prefix or ''):
        raise ValueError(f'id_prefix 必须是 2 个大写字母，收到 {prefix!r}')
    if not isinstance(year, int) or not MIN_YEAR <= year <= MAX_YEAR:
        raise ValueError(f'年份超出 {MIN_YEAR}-{MAX_YEAR}：{year!r}')
    if not isinstance(seq, int) or not 1 <= seq <= MAX_SEQ:
        raise ValueError(
            f'场内序号必须在 1-{MAX_SEQ} 之间，收到 {seq!r}。'
            f'若某场次真的超过 {MAX_SEQ} 篇，需要先修改 ID 规则再重新分配。'
        )
    return f'{prefix}{year % 100:02d}{seq:03d}'


def parse_id(paper_id: str) -> ParsedId:
    """反解 ID，供测试与调试使用。

    只返回年份的后两位，不猜世纪 —— 数据里同时有 OSDI 1994 和 ASPLOS 2026，
    真实年份要看记录的 `year` 字段。
    """
    m = _ID_RE.match(paper_id or '')
    if not m:
        raise ValueError(f'不是合法的论文 ID：{paper_id!r}')
    return ParsedId(m.group(1), m.group(2), int(m.group(3)))


def build_tag(type_code: str, topic_code: str, award_code: str) -> str:
    """`'1'`, `'A3'`, `'N'` -> `'1A3N'`。"""
    from analyzers import id_taxonomy as taxonomy

    if type_code not in taxonomy.KNOWN_TYPE_CODES:
        raise ValueError(f'未知的类型码：{type_code!r}')
    if topic_code not in taxonomy.KNOWN_TOPIC_CODES:
        raise ValueError(f'未知的 topic 码：{topic_code!r}')
    if award_code not in taxonomy.KNOWN_AWARD_CODES:
        raise ValueError(f'未知的奖项码：{award_code!r}')
    return f'{type_code}{topic_code}{award_code}'


# --------------------------------------------------------------------------
# data.yml 的 id_prefix
# --------------------------------------------------------------------------

def collect_prefixes(config: dict) -> dict[str, str]:
    """从 data.yml 的配置中取出 {会议名: 前缀}，并校验完整性与唯一性。

    缺失或撞车都直接抛错 —— 新增会议时忘了配前缀，应该让构建失败，而不是静默
    产出重复 ID。
    """
    prefixes: dict[str, str] = {}
    seen: dict[str, str] = {}
    missing: list[str] = []
    for key, publication_config in config.items():
        name = publication_config.get('name', key)
        prefix = publication_config.get('id_prefix')
        if not prefix:
            missing.append(f'{key} ({name})')
            continue
        if not _PREFIX_RE.match(prefix):
            raise ValueError(f'{key} 的 id_prefix 必须是 2 个大写字母，收到 {prefix!r}')
        if prefix in seen:
            raise ValueError(
                f'id_prefix {prefix!r} 被 {seen[prefix]!r} 和 {name!r} 同时使用；'
                f'每个会议必须有唯一前缀'
            )
        seen[prefix] = name
        prefixes[name] = prefix
    if missing:
        raise ValueError(
            'data.yml 中这些会议缺少 id_prefix：' + '、'.join(missing)
            + '。参见 docs/id-rule.md 第 1.1 节。'
        )
    return prefixes


# --------------------------------------------------------------------------
# 台账
# --------------------------------------------------------------------------

def load_ledger(path: str = LEDGER_PATH) -> dict:
    """读取台账。文件不存在视作空台账；文件损坏则抛错。

    损坏时**不静默重建** —— 重建等于全站 ID 洗牌，那正是本方案要消灭的事。
    """
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        try:
            ledger = json.load(f)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f'{path} 解析失败：{exc}。请从 git 恢复，不要删除后重新生成 —— '
                f'重新生成会让全站 ID 洗牌。'
            ) from exc
    if not isinstance(ledger, dict):
        raise ValueError(f'{path} 的顶层必须是对象，实际是 {type(ledger).__name__}')
    for publication, years in ledger.items():
        for year, entries in years.items():
            seqs = list(entries.values())
            if len(seqs) != len(set(seqs)):
                raise ValueError(f'{path} 中 {publication} {year} 存在重复序号')
    return ledger


def save_ledger(ledger: dict, path: str = LEDGER_PATH) -> None:
    """写回台账。键有序，追加时 git diff 只有新增行。"""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(ledger, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')


def _candidate_keys(title: str, url: str, entries: dict) -> list[str]:
    """台账键的候选，由宽到窄。

    标题优先是因为标题稳定而 URL 会变（NDSS 会把 `auto-draft-242` 改成正式 slug）。
    第二级带 URL 是为了区分场内真的重名的论文（USENIX Sec 2026 有 4 篇标题都是
    "Paper Title Under Embargo"）。第三级起补数字后缀，兜住标题与 URL 都相同的
    脏数据 —— 那是数据问题，用 `--check-titles` 排查，但不该让整个构建停下来。

    候选个数按台账中同族键的数量动态取，保证至少有一个空位可用。
    """
    base = compact(title)
    url_part = compact(url)
    keys = [base]
    if url_part:
        keys.append(f'{base}#{url_part}')
    family = sum(1 for k in entries if k == base or k.startswith(base + '#'))
    stem = keys[-1]
    keys.extend(f'{stem}#{i}' for i in range(2, family + 3))
    return keys


def assign_seq(
    ledger: dict,
    publication: str,
    year: int,
    papers: Sequence[tuple[str, str]],
) -> list[int]:
    """为一个场次的论文分配场内序号，就地更新 `ledger`。

    `papers` 是 `(title, url)` 序列。返回与之等长、顺序对应的序号列表。

    算法见 docs/id-rule.md 第 4.2 节：组内先按 `(compact(title), compact(url))`
    排序保证确定性，再逐篇取第一个「台账中已有且本轮未被占用」的候选键，取不到就
    分配新号。
    """
    entries = ledger.setdefault(publication, {}).setdefault(str(year), {})
    next_seq = max(entries.values(), default=0) + 1

    order = sorted(
        range(len(papers)),
        key=lambda i: (compact(papers[i][0]), compact(papers[i][1])),
    )

    result: list[int | None] = [None] * len(papers)
    claimed: set[str] = set()

    for i in order:
        title, url = papers[i]
        candidates = _candidate_keys(title, url, entries)

        # 1. 沿用台账中已有、且本轮尚未被占用的键
        for key in candidates:
            if key in entries and key not in claimed:
                claimed.add(key)
                result[i] = entries[key]
                break
        else:
            # 2. 取第一个台账中不存在的键，分配新号
            for key in candidates:
                if key not in entries:
                    if next_seq > MAX_SEQ:
                        raise ValueError(
                            f'{publication} {year} 的场内序号将达到 {next_seq}，'
                            f'超过上限 {MAX_SEQ}。需要先修改 docs/id-rule.md '
                            f'第 1.3 节的规则再重新分配。'
                        )
                    entries[key] = next_seq
                    claimed.add(key)
                    result[i] = next_seq
                    next_seq += 1
                    break
            else:  # pragma: no cover - _candidate_keys 保证总有空位
                raise AssertionError(
                    f'{publication} {year} 的候选键全部被占用：{title!r} <{url}>'
                )

    assert all(seq is not None for seq in result)
    return result  # type: ignore[return-value]


def assign_ids(
    ledger: dict,
    prefix: str,
    publication: str,
    year: int,
    papers: Sequence[tuple[str, str]],
) -> list[str]:
    """`assign_seq` + `build_id`，返回与 `papers` 等长的 ID 列表。"""
    return [build_id(prefix, year, seq) for seq in assign_seq(ledger, publication, year, papers)]


def ledger_stats(ledger: dict) -> dict:
    """
    台账概况，供 `--analyze` 收尾时打印。

    `publications` 数会议（IEEE S&P 算一个），`editions` 数场次（publication x
    year，IEEE S&P 2024 与 2025 算两个）。两个词别混用——见 docs/id-rule.md。
    """
    editions = 0
    entries = 0
    for years in ledger.values():
        for group in years.values():
            editions += 1
            entries += len(group)
    return {'publications': len(ledger), 'editions': editions, 'entries': entries}


def iter_ledger_keys(ledger: dict) -> Iterable[tuple[str, str, str, int]]:
    """遍历 (会议, 年份, 键, 序号)。"""
    for publication, years in ledger.items():
        for year, entries in years.items():
            for key, seq in entries.items():
                yield publication, year, key, seq
