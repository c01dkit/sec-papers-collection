"""论文 ID 中 `tag` 段的码表。

规则文档：`docs/id-rule.md` 第 2、3 节。**本模块与该文档必须逐条一致** ——
`tests/test_id_taxonomy.py` 会重新解析文档的第 3 节并比对，改一边忘另一边会变红。

码表是 append-only 的：已分配的码值永不改动、永不复用。新 topic 只能取所在段的
下一个空位。这不是洁癖 —— 码值进了 `data.json` 和 `meta_json/*.json`，改一个历史
码等于让所有引用它的记录同时变更。
"""

from __future__ import annotations


def normalize(name: str) -> str:
    """大小写无关 + 空白折叠。别名匹配与码表查找都走这个形式。"""
    return ' '.join(str(name).split()).casefold()


# --------------------------------------------------------------------------
# t[0] 论文类型
# --------------------------------------------------------------------------

TYPE_UNANALYZED = '0'   # 默认值，待分析
TYPE_OTHER = '9'        # 不属于任何已知分类

TYPE_CODES: dict[str, str] = {
    'method design': '1',
    'measurement': '2',
    'benchmark': '3',
    'dataset': '4',
    'survey': '5',
    'sok': '6',
    'user study': '7',
    # '8' 保留
}

KNOWN_TYPE_CODES = frozenset(TYPE_CODES.values()) | {TYPE_UNANALYZED, TYPE_OTHER}

#: 从已有 `advanced_data/*.jsonl` 的自由文本 `categories` 回填类型时的优先级。
#: 顺序即优先级，取第一个命中的。
#:
#: 前段是**特征性**标签：命中它们基本能定性。后段（`approach` / `system` /
#: `attack` …）是**末位兜底**：单看它们区分度不足，但排在最后就没有这个问题 ——
#: 一篇论文若不是 survey / SoK / user study / measurement / benchmark / dataset，
#: 而它被标了 approach，那它就是 method design。这一段覆盖了 78.7% 的存量产出，
#: 省下同等数量的 LLM 请求。
#:
#: `empirical`(9324) 例外，故意不映射：它描述的是研究方法而非贡献类型，
#: 一篇 empirical 论文可能是 measurement 也可能是 user study。
CATEGORY_TYPE_PRIORITY: tuple[tuple[str, str], ...] = (
    # 特征性标签
    ('survey', '5'),
    ('user study', '7'),
    ('user_study', '7'),
    ('human', '7'),
    ('measurement', '2'),
    ('benchmark', '3'),
    ('dataset', '4'),
    # 末位兜底 -> method design
    ('attack', '1'),
    ('defense', '1'),
    ('approach', '1'),
    ('system', '1'),
    ('algorithm', '1'),
    ('implementation', '1'),
    ('tool', '1'),
    ('protocol', '1'),
)


# --------------------------------------------------------------------------
# t[1:2] topic
# --------------------------------------------------------------------------

TOPIC_UNCLASSIFIED = '00'   # 默认值，未分类
TOPIC_OTHER = 'FF'          # 不属于以上任何分类

#: (段名, 起始码, 结束码)，闭区间。第一位十六进制即可判段。
TOPIC_BANDS: tuple[tuple[str, int, int], ...] = (
    ('security', 0x01, 0x7F),
    ('software-engineering', 0x80, 0xBF),
    ('system', 0xC0, 0xEF),
)
#: F0-FE 保留

TOPIC_CODES: dict[str, str] = {
    # 01-0F  系统与基础设施安全
    'System security': '01',
    'Operating systems security': '02',
    'Distributed systems security': '03',
    'Cloud computing security': '04',
    'Security for cloud/edge computing': '05',
    'Embedded systems security': '06',
    'IoT security': '07',
    'Security for cyber-physical systems': '08',
    'Security for large-scale critical infrastructures': '09',
    'Security architectures': '0A',
    'Trustworthy computing': '0B',
    'Virtualization and container security': '0C',
    'Storage and file system security': '0D',
    'VR/AR security': '0E',
    'Game security': '0F',

    # 10-1F  网络与 Web 安全
    'Network security': '10',
    'Network security measurement': '11',
    'Network infrastructure security': '12',
    'Intrusion detection and prevention': '13',
    'Denial-of-service attacks and countermeasures': '14',
    'Analysis of network and security protocols': '15',
    'Integrating security in network protocols': '16',
    'Network security policy implementation and management': '17',
    'Security for emerging networks': '18',
    'Security for future Internet architectures': '19',
    'Wireless and mobile security/privacy': '1A',
    'Web security and privacy': '1B',
    'Security of web-based applications and services': '1C',
    'Mobile security': '1D',
    'Browser security': '1E',
    'Software-defined networking security': '1F',

    # 20-2F  软件与程序分析安全
    'Software security': '20',
    'Automated security analysis of source code and binaries': '21',
    'Program and binary analysis': '22',
    'Fuzzing and vulnerability discovery': '23',
    'Software supply chain security': '24',
    'Malware analysis and unwanted software': '25',
    'Anti-malware techniques': '26',
    'Forensics and diagnostics for security': '27',
    'Cyber-crime defense and forensics': '28',
    'Cyber attack prevention, detection, investigation, and response': '29',
    'Attacks with novel insights, techniques, or results': '2A',
    'Memory safety and exploit mitigation': '2B',
    'Reverse engineering': '2C',
    'Language-based security': '2D',

    # 30-3F  硬件与侧信道
    'Hardware security': '30',
    'Secure computer architectures': '31',
    'Side channels': '32',
    'Detection of malicious or counterfeit hardware': '33',
    'Automated security analysis of hardware designs': '34',
    'Physical security': '35',

    # 40-4F  密码学
    'Applied cryptography': '40',
    'Applications of cryptography': '41',
    'Analysis of deployed cryptography and protocols': '42',
    'Cryptographic implementation analysis': '43',
    'New cryptographic protocols with real-world applications': '44',
    'Public key infrastructures and key management': '45',
    'Secure multi-party computation': '46',
    'Information theory and security': '47',

    # 50-5F  区块链与访问控制
    'Blockchains and distributed ledger security': '50',
    'Security and privacy for blockchains and cryptocurrencies': '51',
    'Smart contract security': '52',
    'Authentication, access control, and authorization': '53',

    # 60-6F  隐私
    'Privacy and anonymity': '60',
    'Privacy and anonymity in networks and distributed systems': '61',
    'Privacy-preserving computation': '62',
    'Privacy attacks': '63',
    'Privacy metrics': '64',
    'Surveillance and censorship': '65',
    'Security and privacy metrics': '66',
    'Social network security and privacy': '67',

    # 70-7F  人因、机器学习与方法学
    'Human-centered security and privacy': '70',
    'Usable security and privacy': '71',
    'User studies for security and privacy': '72',
    'Security and privacy law, policy, and ethics': '73',
    'Security education and training': '74',
    'Security for at-risk populations': '75',
    'Understanding and mitigating information manipulation, disinformation, harassment, extremism, and abuse': '76',
    'Economics of security and privacy': '77',
    'Formal methods and verification': '78',
    'Program verification for security': '79',
    'Security of machine learning': '7A',
    'Privacy of machine learning': '7B',
    'ML integrity and availability': '7C',
    'Attacks on ML systems': '7D',
    'Verifying security and privacy properties of ML algorithms': '7E',
    'Special problems and tradeoffs (security vs. efficiency/usability/cost/ethics)': '7F',

    # 80-8F  测试与分析
    'Software testing': '80',
    'Test generation and prioritization': '81',
    'Static analysis and linting': '82',
    'Dynamic analysis and instrumentation': '83',
    'Symbolic execution and constraint solving': '84',
    'Program verification and model checking': '85',
    'Automated program repair': '86',
    'Fault localization and debugging': '87',
    'Bug and defect prediction': '88',
    'Mutation testing': '89',
    'Concurrency and distributed system testing': '8A',
    'GUI and end-to-end testing': '8B',
    'Performance analysis and profiling': '8C',
    'Regression testing and continuous integration': '8D',
    'Flaky test analysis': '8E',
    'Runtime verification and monitoring': '8F',

    # 90-9F  程序与代码
    'Program comprehension': '90',
    'Code search and recommendation': '91',
    'Code clone detection': '92',
    'Refactoring': '93',
    'Program synthesis': '94',
    'Compilers and language implementation': '95',
    'Type systems and language design': '96',
    'API design, usage and misuse': '97',
    'Configuration and build systems': '98',
    'Dependency and package management': '99',
    'Code review': '9A',
    'Version control and change analysis': '9B',
    'Technical debt and code smells': '9C',
    'Documentation and comments': '9D',
    'Logging and observability': '9E',
    'Software architecture and design': '9F',

    # A0-AF  过程、人与 AI
    'Requirements engineering': 'A0',
    'Software process and project management': 'A1',
    'Developer productivity and human factors': 'A2',
    'Empirical studies of developers': 'A3',
    'Open source ecosystems and community': 'A4',
    'Mining software repositories': 'A5',
    'Software maintenance and evolution': 'A6',
    'Software reuse': 'A7',
    'Software engineering education': 'A8',
    'Large language models for software engineering': 'A9',
    'Machine learning for software engineering': 'AA',
    'Software engineering for machine learning systems': 'AB',
    'AI code generation and programming assistants': 'AC',
    'Benchmarks and datasets for software engineering': 'AD',
    'Software ecosystems and app stores': 'AE',
    'Green and sustainable software': 'AF',

    # B0-BF  领域与质量属性
    'Mobile app analysis': 'B0',
    'Web application engineering': 'B1',
    'Cloud and microservice engineering': 'B2',
    'DevOps and deployment': 'B3',
    'Embedded and cyber-physical software': 'B4',
    'Blockchain and smart contract engineering': 'B5',
    'Quantum software engineering': 'B6',
    'Safety-critical software and certification': 'B7',
    'Reliability and availability engineering': 'B8',
    'Usability and accessibility engineering': 'B9',
    'Software energy efficiency': 'BA',
    'Software licensing and legal issues': 'BB',
    'Formal specification': 'BC',
    'Software modeling and model-driven engineering': 'BD',
    'Software analytics': 'BE',

    # C0-CF  操作系统与分布式
    'Operating system design': 'C0',
    'Kernel and microkernel architecture': 'C1',
    'Virtualization and hypervisors': 'C2',
    'Containers and sandboxing': 'C3',
    'Memory management': 'C4',
    'Scheduling': 'C5',
    'Concurrency and synchronization': 'C6',
    'File systems': 'C7',
    'Storage systems': 'C8',
    'Persistent memory': 'C9',
    'I/O and device drivers': 'CA',
    'Serverless and cloud runtimes': 'CB',
    'Distributed systems': 'CC',
    'Consensus and replication': 'CD',
    'Fault tolerance and reliability': 'CE',
    'Formal verification of systems': 'CF',

    # D0-DF  网络与体系结构
    'Datacenter networking': 'D0',
    'Network stacks and RDMA': 'D1',
    'Computer architecture': 'D2',
    'Memory and cache hierarchy': 'D3',
    'Accelerators and heterogeneous computing': 'D4',
    'GPU systems': 'D5',
    'Interconnects and network-on-chip': 'D6',
    'Processor microarchitecture': 'D7',
    'Near-data and in-memory processing': 'D8',
    'Non-volatile and emerging memory': 'D9',
    'Energy and power management': 'DA',
    'Reconfigurable computing and FPGA': 'DB',
    'Quantum computing systems': 'DC',
    'Compilers and runtime systems': 'DD',
    'Binary translation and emulation': 'DE',
    'Hardware/software co-design': 'DF',

    # E0-EF  应用系统
    'Machine learning systems': 'E0',
    'LLM serving and inference systems': 'E1',
    'Training systems and parallelism': 'E2',
    'Data processing and analytics systems': 'E3',
    'Database systems': 'E4',
    'Key-value stores and caching': 'E5',
    'Graph processing systems': 'E6',
    'Stream processing': 'E7',
    'Edge and mobile systems': 'E8',
    'Real-time systems': 'E9',
    'Blockchain systems': 'EA',
    'Trusted execution environments': 'EB',
    'System performance measurement': 'EC',
    'Tracing, debugging and diagnosis for systems': 'ED',
    'Benchmarks and workload characterization': 'EE',
    'Resource management and scheduling policies': 'EF',
}

#: `llm_analyzer.py:295` 的 `_validate_schema` 长期被注释掉，已有产出中的 topic 串
#: 漂出了白名单（白名单 75 个，实际出现 136 个）。此表把非规范串归并到规范码。
#: 其中两条的乱码字符是模型产出里真实存在的，**不要"修正"** —— 匹配按字面进行。
TOPIC_ALIASES: dict[str, str] = {
    'Other': 'FF',                                                                              # 504
    'Trusted computing': '0B',                                                                  # 49
    'Cyber-physical systems security': '08',                                                    # 14
    'Cyber-physical systems': '08',                                                             # 13
    'Security metrics': '66',                                                                   # 9
    'Security for web-based applications and services': '1C',                                   # 6
    'Cyber attack prevention, detection, investigation, and reference': '29',                   # 6
    'Adversarial machine learning': '7D',                                                       # 5
    'Security and privacy for large-scale critical infrastructures': '09',                      # 4
    'Vulnerability discovery': '23',                                                            # 4
    'Malware analysis and unwanter software': '25',                                             # 3
    'Security and privacy policy': '73',                                                        # 3
    'Security measurement': '66',                                                               # 2
    'Cyber attack prevention, detection, investigation, and conversion': '29',                  # 2
    'Security and privacy policy implementation and management': '17',                          # 2
    'Exploit mitigations': '2B',                                                                # 2
    'Safety': 'FF',                                                                             # 2
    'Virtualization security': '0C',                                                            # 2
    'Security and privacy for at-risk populations': '75',                                       # 2
    'Security and privacy for cyber-physical systems': '08',                                    # 2
    'Malware analysis andহীনunwanted software': '25',                                           # 1
    'Smart home security': '07',                                                                # 1
    'Secure architectures': '0A',                                                               # 1
    'Storage system security': '0D',                                                            # 1
    'Security of cyber-physical systems': '08',                                                 # 1
    'Smart contracts': '52',                                                                    # 1
    'Secure computation': '46',                                                                 # 1
    'Content moderation': '76',                                                                 # 1
    'Measurement studies': '66',                                                                # 1
    'Security for edge computing': '05',                                                        # 1
    'Memory safety': '2B',                                                                      # 1
    'Graph-based Security and Privacy Analytics': 'FF',                                         # 1
    'Dynamic analysis': '22',                                                                   # 1
    'Social engineering': '76',                                                                 # 1
    'Measurement of malware and unwanted software': '25',                                       # 1
    'Access control': '53',                                                                     # 1
    'Adversarial examples': '7D',                                                               # 1
    'Adversarial purification': '7D',                                                           # 1
    'Critical infrastructure security': '09',                                                   # 1
    'Smart contracts security': '52',                                                           # 1
    'Forensics and diagnostics forво': '27',                                                    # 1
    'Adversarial patch defenses': '7D',                                                         # 1
    'Social network security': '67',                                                            # 1
    'Internet security policies': '17',                                                         # 1
    'Mobile security/privacy': '1A',                                                            # 1
    'Storage security': '0D',                                                                   # 1
    'Security and privacy measurement': '66',                                                   # 1
    'Security for machine learning': '7A',                                                      # 1
    'Multi-party computation': '46',                                                            # 1
    'Smart contracts and decentralized applications security': '52',                            # 1
    'Measurement of privacy leakage': '63',                                                     # 1
    'Adversarial learning': '7D',                                                               # 1
    'Botnets': '25',                                                                            # 1
}

KNOWN_TOPIC_CODES = frozenset(TOPIC_CODES.values()) | {TOPIC_UNCLASSIFIED, TOPIC_OTHER}

_TOPIC_BY_NORM = {normalize(k): v for k, v in TOPIC_CODES.items()}
_ALIAS_BY_NORM = {normalize(k): v for k, v in TOPIC_ALIASES.items()}


# --------------------------------------------------------------------------
# t[3] 奖项
# --------------------------------------------------------------------------

AWARD_NONE = 'N'

#: 一篇论文获多个奖时的优先级，靠前者胜。
AWARD_PRIORITY = 'TDHAP'

#: 键取自 `src/assets/data/awards.json` 的 `awards[].name`。
#: `tests/test_id_taxonomy.py` 断言该文件中出现的每个奖项名都在此表内。
AWARD_CODES: dict[str, str] = {
    'Distinguished Paper Award': 'D',
    'Best Paper Award': 'D',
    'Best Student Paper Award': 'D',
    'Best Practical Paper Award': 'D',
    'Distinguished Paper Award Honorable Mentions': 'H',
    'Test of Time Award': 'T',
    'Distinguished Artifact Award': 'A',
    'Artifact Evaluation Award': 'A',
    'Best Technical Poster Award': 'P',
    'Distinguished Technical Poster Award': 'P',
    'Best Poster Presentation Award': 'P',
    'Distinguished Poster Presentation': 'P',
    'Best Poster Award': 'P',
    'Best Post Award': 'P',
    'AI-Selected "Best" Poster Award': 'P',
    'Best Screenplay Award': 'P',
    'Best Film Editing Award': 'P',
    'Best Video Award': 'P',
}

#: 这些奖项在 `awards.json` 里记的是**获奖年份**而非论文的发表年份 —— 时间检验奖
#: 的性质就是颁给多年前的论文（2025 年的 ToT 授予 2015 年的论文）。匹配时必须忽略
#: 年份，只在同一会议内按标题对齐，否则它们永远匹配不上。
YEAR_AGNOSTIC_AWARDS = frozenset({'Test of Time Award'})

KNOWN_AWARD_CODES = frozenset(AWARD_CODES.values()) | {AWARD_NONE}

_AWARD_BY_NORM = {normalize(k): v for k, v in AWARD_CODES.items()}


# --------------------------------------------------------------------------
# 查表
# --------------------------------------------------------------------------

def topic_code(name: str | None) -> str:
    """topic 名 -> 2 位大写十六进制码。

    空名字给 `00`（不知道），认不出的非空名字给 `FF`（知道但放不进码表）——
    这两者含义不同，别合并。
    """
    if not name or not str(name).strip():
        return TOPIC_UNCLASSIFIED
    key = normalize(name)
    return _TOPIC_BY_NORM.get(key) or _ALIAS_BY_NORM.get(key) or TOPIC_OTHER


def type_code(name: str | None) -> str:
    """类型名 -> `0`-`9`。认不出的给 `0`（待分析），不是 `9`。"""
    if not name or not str(name).strip():
        return TYPE_UNANALYZED
    return TYPE_CODES.get(normalize(name), TYPE_UNANALYZED)


def type_code_from_categories(categories) -> str:
    """从 `advanced_data` 的自由文本 `categories` 列表回填类型码。

    按 `CATEGORY_TYPE_PRIORITY` 取第一个命中的；都没命中给 `0`。
    """
    if not categories:
        return TYPE_UNANALYZED
    if isinstance(categories, str):
        categories = [categories]
    norm = {normalize(c) for c in categories if c}
    for needle, code in CATEGORY_TYPE_PRIORITY:
        if needle in norm:
            return code
    return TYPE_UNANALYZED


def award_code(names) -> str:
    """奖项名（单个或多个）-> 一个字母。多个奖取 `AWARD_PRIORITY` 中最靠前的。"""
    if not names:
        return AWARD_NONE
    if isinstance(names, str):
        names = [names]
    codes = {_AWARD_BY_NORM.get(normalize(n)) for n in names if n}
    codes.discard(None)
    if not codes:
        return AWARD_NONE
    return min(codes, key=AWARD_PRIORITY.index)


def band_of(code: str) -> str | None:
    """码值所属的段名；`00` / `FF` / 保留区返回 None。"""
    try:
        value = int(code, 16)
    except (TypeError, ValueError):
        return None
    for name, lo, hi in TOPIC_BANDS:
        if lo <= value <= hi:
            return name
    return None
