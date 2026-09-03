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

#: 码 -> 中文名。键集合与 TOPIC_CODES 的值集合恒等（测试断言）。
#: 这是前端中文页显示的规范译名；LLM 产出里的 topics_zh 是即兴翻译，不用。
#: 与 docs/id-rule.md 第 3 节「中文」列逐条一致。
TOPIC_NAMES_ZH: dict[str, str] = {
    # 01-0F  系统与基础设施安全
    '01': '系统安全',
    '02': '操作系统安全',
    '03': '分布式系统安全',
    '04': '云计算安全',
    '05': '云/边缘计算安全',
    '06': '嵌入式系统安全',
    '07': '物联网安全',
    '08': '信息物理系统安全',
    '09': '大规模关键基础设施安全',
    '0A': '安全体系结构',
    '0B': '可信计算',
    '0C': '虚拟化与容器安全',
    '0D': '存储与文件系统安全',
    '0E': 'VR/AR 安全',
    '0F': '游戏安全',

    # 10-1F  网络与 Web 安全
    '10': '网络安全',
    '11': '网络安全测量',
    '12': '网络基础设施安全',
    '13': '入侵检测与防御',
    '14': '拒绝服务攻击与对策',
    '15': '网络与安全协议分析',
    '16': '网络协议的安全集成',
    '17': '网络安全策略实施与管理',
    '18': '新兴网络安全',
    '19': '未来互联网架构安全',
    '1A': '无线与移动安全/隐私',
    '1B': 'Web 安全与隐私',
    '1C': 'Web 应用与服务安全',
    '1D': '移动安全',
    '1E': '浏览器安全',
    '1F': '软件定义网络安全',

    # 20-2F  软件与程序分析安全
    '20': '软件安全',
    '21': '源代码与二进制的自动化安全分析',
    '22': '程序与二进制分析',
    '23': '模糊测试与漏洞挖掘',
    '24': '软件供应链安全',
    '25': '恶意软件分析与不良软件',
    '26': '反恶意软件技术',
    '27': '安全取证与诊断',
    '28': '网络犯罪防御与取证',
    '29': '网络攻击的预防、检测、调查与响应',
    '2A': '具有新见解、新技术或新结果的攻击',
    '2B': '内存安全与漏洞利用缓解',
    '2C': '逆向工程',
    '2D': '基于语言的安全',

    # 30-3F  硬件与侧信道
    '30': '硬件安全',
    '31': '安全计算机体系结构',
    '32': '侧信道',
    '33': '恶意或伪造硬件检测',
    '34': '硬件设计的自动化安全分析',
    '35': '物理安全',

    # 40-4F  密码学
    '40': '应用密码学',
    '41': '密码学应用',
    '42': '已部署密码系统与协议分析',
    '43': '密码实现分析',
    '44': '面向实际应用的新密码协议',
    '45': '公钥基础设施与密钥管理',
    '46': '安全多方计算',
    '47': '信息论与安全',

    # 50-5F  区块链与访问控制
    '50': '区块链与分布式账本安全',
    '51': '区块链与加密货币的安全与隐私',
    '52': '智能合约安全',
    '53': '认证、访问控制与授权',

    # 60-6F  隐私
    '60': '隐私与匿名',
    '61': '网络与分布式系统中的隐私与匿名',
    '62': '隐私保护计算',
    '63': '隐私攻击',
    '64': '隐私度量',
    '65': '监控与审查',
    '66': '安全与隐私度量',
    '67': '社交网络安全与隐私',

    # 70-7F  人因、机器学习与方法学
    '70': '以人为中心的安全与隐私',
    '71': '可用安全与隐私',
    '72': '安全与隐私的用户研究',
    '73': '安全与隐私的法律、政策与伦理',
    '74': '安全教育与培训',
    '75': '高风险人群的安全',
    '76': '信息操纵、虚假信息、骚扰、极端主义与滥用的理解与缓解',
    '77': '安全与隐私经济学',
    '78': '形式化方法与验证',
    '79': '面向安全的程序验证',
    '7A': '机器学习安全',
    '7B': '机器学习隐私',
    '7C': '机器学习的完整性与可用性',
    '7D': '针对机器学习系统的攻击',
    '7E': '机器学习算法安全与隐私属性验证',
    '7F': '特殊问题与权衡（安全与效率/可用性/成本/伦理）',

    # 80-8F  测试与分析
    '80': '软件测试',
    '81': '测试生成与优先级排序',
    '82': '静态分析与代码检查',
    '83': '动态分析与插桩',
    '84': '符号执行与约束求解',
    '85': '程序验证与模型检验',
    '86': '自动程序修复',
    '87': '缺陷定位与调试',
    '88': '缺陷预测',
    '89': '变异测试',
    '8A': '并发与分布式系统测试',
    '8B': 'GUI 与端到端测试',
    '8C': '性能分析与剖析',
    '8D': '回归测试与持续集成',
    '8E': '不稳定测试分析',
    '8F': '运行时验证与监控',

    # 90-9F  程序与代码
    '90': '程序理解',
    '91': '代码搜索与推荐',
    '92': '代码克隆检测',
    '93': '重构',
    '94': '程序合成',
    '95': '编译器与语言实现',
    '96': '类型系统与语言设计',
    '97': 'API 设计、使用与误用',
    '98': '配置与构建系统',
    '99': '依赖与包管理',
    '9A': '代码评审',
    '9B': '版本控制与变更分析',
    '9C': '技术债与代码异味',
    '9D': '文档与注释',
    '9E': '日志与可观测性',
    '9F': '软件架构与设计',

    # A0-AF  过程、人与 AI
    'A0': '需求工程',
    'A1': '软件过程与项目管理',
    'A2': '开发者效率与人因',
    'A3': '开发者实证研究',
    'A4': '开源生态与社区',
    'A5': '软件仓库挖掘',
    'A6': '软件维护与演化',
    'A7': '软件复用',
    'A8': '软件工程教育',
    'A9': '面向软件工程的大语言模型',
    'AA': '面向软件工程的机器学习',
    'AB': '机器学习系统的软件工程',
    'AC': 'AI 代码生成与编程助手',
    'AD': '软件工程基准与数据集',
    'AE': '软件生态与应用商店',
    'AF': '绿色与可持续软件',

    # B0-BF  领域与质量属性
    'B0': '移动应用分析',
    'B1': 'Web 应用工程',
    'B2': '云与微服务工程',
    'B3': 'DevOps 与部署',
    'B4': '嵌入式与信息物理软件',
    'B5': '区块链与智能合约工程',
    'B6': '量子软件工程',
    'B7': '安全关键软件与认证',
    'B8': '可靠性与可用性工程',
    'B9': '可用性与无障碍工程',
    'BA': '软件能效',
    'BB': '软件许可与法律问题',
    'BC': '形式化规约',
    'BD': '软件建模与模型驱动工程',
    'BE': '软件分析学',

    # C0-CF  操作系统与分布式
    'C0': '操作系统设计',
    'C1': '内核与微内核架构',
    'C2': '虚拟化与虚拟机监控器',
    'C3': '容器与沙箱',
    'C4': '内存管理',
    'C5': '调度',
    'C6': '并发与同步',
    'C7': '文件系统',
    'C8': '存储系统',
    'C9': '持久内存',
    'CA': 'I/O 与设备驱动',
    'CB': '无服务器与云运行时',
    'CC': '分布式系统',
    'CD': '共识与复制',
    'CE': '容错与可靠性',
    'CF': '系统形式化验证',

    # D0-DF  网络与体系结构
    'D0': '数据中心网络',
    'D1': '网络协议栈与 RDMA',
    'D2': '计算机体系结构',
    'D3': '内存与缓存层次',
    'D4': '加速器与异构计算',
    'D5': 'GPU 系统',
    'D6': '互连与片上网络',
    'D7': '处理器微架构',
    'D8': '近数据与存内计算',
    'D9': '非易失与新型存储器',
    'DA': '能耗与功耗管理',
    'DB': '可重构计算与 FPGA',
    'DC': '量子计算系统',
    'DD': '编译器与运行时系统',
    'DE': '二进制翻译与仿真',
    'DF': '软硬件协同设计',

    # E0-EF  应用系统
    'E0': '机器学习系统',
    'E1': '大模型推理服务系统',
    'E2': '训练系统与并行',
    'E3': '数据处理与分析系统',
    'E4': '数据库系统',
    'E5': '键值存储与缓存',
    'E6': '图处理系统',
    'E7': '流处理',
    'E8': '边缘与移动系统',
    'E9': '实时系统',
    'EA': '区块链系统',
    'EB': '可信执行环境',
    'EC': '系统性能测量',
    'ED': '系统追踪、调试与诊断',
    'EE': '基准测试与负载特征分析',
    'EF': '资源管理与调度策略',
}

#: 两个哨兵码的 (en, zh)。它们不在 TOPIC_CODES 里，但前端要显示。
SENTINEL_TOPIC_NAMES: dict[str, tuple[str, str]] = {
    TOPIC_UNCLASSIFIED: ('Unclassified', '未分类'),
    TOPIC_OTHER: ('Other', '其他'),
}

#: 段名 -> (en, zh)。键与 TOPIC_BANDS 的段名一致。
BAND_NAMES: dict[str, tuple[str, str]] = {
    'security': ('Security', '安全'),
    'software-engineering': ('Software engineering', '软件工程'),
    'system': ('Systems and architecture', '系统与体系结构'),
}

#: (lo, hi, band, en, zh)，闭区间，按码值升序，互不重叠，每条落在一个段内。
#: 中文名与 docs/id-rule.md 第 3 节的 `####` 分组标题逐字一致；英文名跟在标题的 ` · ` 之后。
TOPIC_GROUPS: tuple[tuple[str, str, str, str, str], ...] = (
    ('01', '0F', 'security', 'Systems and infrastructure security', '系统与基础设施安全'),
    ('10', '1F', 'security', 'Network and web security', '网络与 Web 安全'),
    ('20', '2F', 'security', 'Software and program analysis security', '软件与程序分析安全'),
    ('30', '3F', 'security', 'Hardware and side channels', '硬件与侧信道'),
    ('40', '4F', 'security', 'Cryptography', '密码学'),
    ('50', '5F', 'security', 'Blockchain and access control', '区块链与访问控制'),
    ('60', '6F', 'security', 'Privacy', '隐私'),
    ('70', '7F', 'security', 'Human factors, machine learning and methodology', '人因、机器学习与方法学'),
    ('80', '8F', 'software-engineering', 'Testing and analysis', '测试与分析'),
    ('90', '9F', 'software-engineering', 'Programs and code', '程序与代码'),
    ('A0', 'AF', 'software-engineering', 'Process, people and AI', '过程、人与 AI'),
    ('B0', 'BF', 'software-engineering', 'Domains and quality attributes', '领域与质量属性'),
    ('C0', 'CF', 'system', 'Operating systems and distributed systems', '操作系统与分布式'),
    ('D0', 'DF', 'system', 'Networking and architecture', '网络与体系结构'),
    ('E0', 'EF', 'system', 'Application systems', '应用系统'),
)

#: 类型码 -> (en, zh)。`8` 保留，不在表内。
TYPE_NAMES: dict[str, tuple[str, str]] = {
    TYPE_UNANALYZED: ('Unanalyzed', '待分析'),
    '1': ('Method design', '方法设计'),
    '2': ('Measurement', '测量研究'),
    '3': ('Benchmark', '基准测试'),
    '4': ('Dataset', '数据集'),
    '5': ('Survey', '综述'),
    '6': ('SoK', 'SoK'),
    '7': ('User study', '用户研究'),
    TYPE_OTHER: ('Other', '其他'),
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


def group_of(code: str) -> tuple[str, str, str, str, str] | None:
    """码值所属的分组 (lo, hi, band, en, zh)；`00` / `FF` / 保留区返回 None。

    2 位大写十六进制的字典序就是数值序，所以直接比字符串。
    """
    if not isinstance(code, str) or len(code) != 2:
        return None
    for group in TOPIC_GROUPS:
        if group[0] <= code <= group[1]:
            return group
    return None


def export_taxonomy() -> dict:
    """组装 `src/assets/data/topics.json` 的内容。结构见 docs/superpowers/specs/2026-09-03-topic-search-design.md。

    前端显示主题名 / 类型名的**唯一**来源。可直接 `json.dump`。
    """
    topics = {code: {'en': name, 'zh': TOPIC_NAMES_ZH[code]} for name, code in TOPIC_CODES.items()}
    for code, (en, zh) in SENTINEL_TOPIC_NAMES.items():
        topics[code] = {'en': en, 'zh': zh}
    return {
        'bands': [
            {'key': key, 'lo': f'{lo:02X}', 'hi': f'{hi:02X}',
             'en': BAND_NAMES[key][0], 'zh': BAND_NAMES[key][1]}
            for key, lo, hi in TOPIC_BANDS
        ],
        'groups': [
            {'lo': lo, 'hi': hi, 'band': band, 'en': en, 'zh': zh}
            for lo, hi, band, en, zh in TOPIC_GROUPS
        ],
        'topics': dict(sorted(topics.items())),
        'types': {code: {'en': en, 'zh': zh} for code, (en, zh) in TYPE_NAMES.items()},
    }
