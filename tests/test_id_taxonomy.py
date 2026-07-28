"""码表的不变式。

最重要的一条是 append-only：码值进了 data.json 和 meta_json/*.json，改一个历史码
等于让所有引用它的记录同时变更 —— 正是本次改造要消灭的那种 churn。
"""

import json
import os
import re
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers import id_taxonomy as T  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, 'docs', 'id-rule.md')
AWARDS = os.path.join(ROOT, 'src', 'assets', 'data', 'awards.json')


# --------------------------------------------------------------------------
# 内部一致性
# --------------------------------------------------------------------------

def test_topic_codes_are_unique():
    codes = list(T.TOPIC_CODES.values())
    assert len(codes) == len(set(codes)), '码值重复'


def test_topic_names_are_unique():
    names = [T.normalize(n) for n in T.TOPIC_CODES]
    assert len(names) == len(set(names)), '规范化后的 topic 名重复'


def test_every_topic_code_is_two_upper_hex():
    for name, code in T.TOPIC_CODES.items():
        assert re.fullmatch(r'[0-9A-F]{2}', code), f'{name!r} 的码 {code!r} 不是 2 位大写十六进制'


def test_every_topic_code_falls_in_a_declared_band():
    for name, code in T.TOPIC_CODES.items():
        assert T.band_of(code) is not None, f'{name!r} 的码 {code} 落在任何已声明的段之外'


def test_sentinels_are_not_reused_as_topics():
    assert T.TOPIC_UNCLASSIFIED not in T.TOPIC_CODES.values()
    assert T.TOPIC_OTHER not in T.TOPIC_CODES.values()


def test_alias_targets_are_known_codes():
    for raw, code in T.TOPIC_ALIASES.items():
        assert code in T.KNOWN_TOPIC_CODES, f'别名 {raw!r} 指向未知码 {code!r}'


def test_alias_keys_are_not_canonical_names():
    canonical = {T.normalize(n) for n in T.TOPIC_CODES}
    for raw in T.TOPIC_ALIASES:
        assert T.normalize(raw) not in canonical, f'{raw!r} 已是规范名，不该再进别名表'


def test_award_codes_are_covered_by_priority():
    for name, code in T.AWARD_CODES.items():
        assert code in T.AWARD_PRIORITY, f'{name!r} 的码 {code!r} 不在优先级串中'


def test_type_codes_are_single_digits():
    for name, code in T.TYPE_CODES.items():
        assert re.fullmatch(r'[0-9]', code), f'{name!r} 的类型码 {code!r} 不是一位数字'
    assert len(set(T.TYPE_CODES.values())) == len(T.TYPE_CODES)


def test_category_priority_targets_are_known_types():
    for needle, code in T.CATEGORY_TYPE_PRIORITY:
        assert code in T.KNOWN_TYPE_CODES, f'{needle!r} 映射到未知类型码 {code!r}'


# --------------------------------------------------------------------------
# 与规则文档同步
# --------------------------------------------------------------------------

def _parse_doc():
    """从 docs/id-rule.md 第 3 节重新解析码表，用于比对。"""
    doc = open(DOC, encoding='utf-8').read()
    body = doc[doc.index('## 3. topic 完整码表'):doc.index('### 3.4 别名表')]
    alias_body = doc[doc.index('### 3.4 别名表'):doc.index('## 4. 台账')]
    rows = re.findall(r'^\| `([0-9A-F]{2})` \| (.+?) \|$', body, re.M)
    topics = {name.strip(): code for code, name in rows if name.strip() != '保留'}
    aliases = {
        raw: code
        for _count, raw, code in re.findall(
            r'^\| (\d+) \| `(.+?)` \| `([0-9A-F]{2})` \|$', alias_body, re.M
        )
    }
    return topics, aliases


def test_topic_table_matches_doc():
    topics, _ = _parse_doc()
    assert topics == T.TOPIC_CODES, (
        'analyzers/id_taxonomy.py 与 docs/id-rule.md 第 3 节不一致；'
        '只差 ' + repr(set(topics.items()) ^ set(T.TOPIC_CODES.items()))
    )


def test_alias_table_matches_doc():
    _, aliases = _parse_doc()
    assert aliases == T.TOPIC_ALIASES, (
        'analyzers/id_taxonomy.py 与 docs/id-rule.md 第 3.4 节不一致；'
        '只差 ' + repr(set(aliases.items()) ^ set(T.TOPIC_ALIASES.items()))
    )


# --------------------------------------------------------------------------
# 与真实数据对接
# --------------------------------------------------------------------------

def test_every_award_name_in_awards_json_has_a_code():
    with open(AWARDS, encoding='utf-8') as f:
        data = json.load(f)
    names = {a['name'] for conf in data for a in conf.get('awards', [])}
    missing = sorted(n for n in names if T.normalize(n) not in {T.normalize(k) for k in T.AWARD_CODES})
    assert not missing, f'awards.json 里这些奖项没有码：{missing}'


@pytest.mark.skipif(
    not os.path.isdir(os.path.join(ROOT, 'official_cache', 'advanced_data')),
    reason='official_cache/ 是本地缓存，CI 上不存在',
)
def test_no_observed_topic_string_falls_through_to_other_unintentionally():
    """已有 LLM 产出里的每个 topic 串，要么有规范码，要么显式列在别名表里。

    只有 'Other' 允许直接落 FF —— 其余串若落到 FF 说明别名表漏了一条。
    """
    import glob

    seen = set()
    pattern = os.path.join(ROOT, 'official_cache', 'advanced_data', '*.jsonl')
    for path in glob.glob(pattern):
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                topics = record.get('topics_en') or []
                if isinstance(topics, str):
                    topics = [topics]
                seen.update(t for t in topics if t)

    known = {T.normalize(k) for k in T.TOPIC_CODES} | {T.normalize(k) for k in T.TOPIC_ALIASES}
    unlisted = sorted(t for t in seen if T.normalize(t) not in known)
    assert not unlisted, f'这些 topic 串没有码也没有别名，会静默落 FF：{unlisted}'


# --------------------------------------------------------------------------
# 查表行为
# --------------------------------------------------------------------------

def test_topic_lookup_is_case_and_whitespace_insensitive():
    assert T.topic_code('Side channels') == '32'
    assert T.topic_code('  SIDE   CHANNELS  ') == '32'
    assert T.topic_code('side channels') == '32'


def test_topic_lookup_resolves_aliases():
    assert T.topic_code('Trusted computing') == T.TOPIC_CODES['Trustworthy computing']
    assert T.topic_code('Botnets') == T.TOPIC_CODES['Malware analysis and unwanted software']
    assert T.topic_code('Adversarial learning') == T.TOPIC_CODES['Attacks on ML systems']


def test_empty_topic_is_unclassified_but_unknown_topic_is_other():
    # 这两者含义不同：不知道 vs 知道但放不进码表
    assert T.topic_code('') == T.TOPIC_UNCLASSIFIED
    assert T.topic_code(None) == T.TOPIC_UNCLASSIFIED
    assert T.topic_code('   ') == T.TOPIC_UNCLASSIFIED
    assert T.topic_code('quantum basket weaving') == T.TOPIC_OTHER


def test_award_code_takes_highest_priority():
    assert T.award_code(['Best Paper Award', 'Test of Time Award']) == 'T'
    assert T.award_code(['Best Poster Award', 'Distinguished Paper Award']) == 'D'
    assert T.award_code(['Distinguished Paper Award Honorable Mentions',
                         'Distinguished Artifact Award']) == 'H'
    assert T.award_code([]) == T.AWARD_NONE
    assert T.award_code(['No Such Award']) == T.AWARD_NONE
    assert T.award_code('Test of Time Award') == 'T'


def test_type_from_categories_falls_back_to_method_design():
    # approach / system 单看区分度不足，但排在特征性标签之后就是安全的兜底
    assert T.type_code_from_categories(['empirical', 'approach', 'system']) == '1'
    assert T.type_code_from_categories(['attack']) == '1'
    assert T.type_code_from_categories([]) == T.TYPE_UNANALYZED


def test_empirical_alone_stays_undecided():
    # empirical 描述的是研究方法而非贡献类型，映射到任何码都是猜
    assert T.type_code_from_categories(['empirical']) == T.TYPE_UNANALYZED
    assert T.type_code_from_categories(['empirical', 'evaluation']) == T.TYPE_UNANALYZED


def test_characteristic_labels_beat_the_fallback():
    # 这是整张表的要害：兜底段绝不能压过特征性标签
    assert T.type_code_from_categories(['approach', 'survey']) == '5'
    assert T.type_code_from_categories(['system', 'measurement']) == '2'
    assert T.type_code_from_categories(['approach', 'system', 'user study']) == '7'
    assert T.type_code_from_categories(['attack', 'dataset']) == '4'


def test_type_from_categories_respects_priority_order():
    # survey 优先于 measurement
    assert T.type_code_from_categories(['measurement', 'survey']) == '5'
    assert T.type_code_from_categories(['user_study', 'measurement']) == '7'


def test_band_boundaries():
    assert T.band_of('01') == 'security'
    assert T.band_of('7F') == 'security'
    assert T.band_of('80') == 'software-engineering'
    assert T.band_of('BF') == 'software-engineering'
    assert T.band_of('C0') == 'system'
    assert T.band_of('EF') == 'system'
    assert T.band_of('00') is None
    assert T.band_of('F0') is None
    assert T.band_of('FF') is None
    assert T.band_of('zz') is None
