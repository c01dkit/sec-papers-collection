# 论文 ID 编码规则

## 0. 为什么是两个字段

一篇论文有两类属性：**它是哪一篇**（永远不变）和**它讲什么**（随分析进展而变）。
把两者塞进同一个串，会让 ID 在 LLM 分析落地时改变 —— 而 ID 正是 IndexedDB
`favorites` 的主键，也是 `meta_json` 增量上传的稳定性来源。ID 一变，收藏静默失效、
文件全量重传。

所以拆成两个字段：

| 字段 | 长度 | 可变性 | 承载 |
| --- | --- | --- | --- |
| `id` | 7 | **永不变** | 领域、会议、年份、场内序号 |
| `tag` | 4 | 随分析更新 | 论文类型、topic、奖项 |

两者都进 `data.json` 和 `meta_json/*.json`。

---

## 1. `id` —— 7 字符稳定标识

```
I  O  25  001
│  │  │   └──── s[4:6]  场内序号，3 位十进制，台账固定
│  │  └───────  s[2:3]  会议年份后两位
│  └──────────  s[1]    会议
└─────────────  s[0]    领域
```

示例：`IO25001` = IEEE S&P 2025 年的第 1 篇。

### 1.1 s[0:1] 领域与会议

前缀不由代码推断，写在 `data.yml` 每个会议的 `id_prefix` 字段里：

```yaml
oakland:
  name: IEEE S&P
  category: top-tier
  id_prefix: IO
```

| 前缀 | 会议 | 取名理由 |
| --- | --- | --- |
| `IO` | IEEE S&P | **I**nformation security · 该会亦称 **O**akland |
| `IC` | ACM CCS | **C**CS |
| `IU` | USENIX Sec | **U**SENIX |
| `IN` | NDSS | **N**DSS |
| `SI` | ICSE | **S**oftware engineering · **I**CSE |
| `SA` | ASE | **A**SE |
| `SF` | FSE | **F**SE |
| `ST` | ISSTA | IS**T**A |
| `OA` | ASPLOS | **O**perating system · **A**SPLOS |
| `OS` | SOSP | **S**OSP |
| `OO` | OSDI | **O**SDI |

生成时断言 11 个前缀两两不重复、且每个会议都配了前缀。**新增会议若忘配或字母撞车，
构建直接失败**，不会静默产出重复 ID。

### 1.2 s[2:3] 年份

公历年份后两位。OSDI 1994 → `94`，SOSP 2001 → `01`。同一会议不存在跨世纪的两位数
冲突（现有数据 1994–2026），故无歧义。

代价：ID 的字典序不等于时间序（`OO94` 排在 `OO25` 之后）。前端排序按 `year` 字段，
不依赖 ID 顺序。

### 1.3 s[4:6] 场内序号

3 位十进制，`001` 起。上限 999，当前峰值 454（USENIX Sec 2025），生成时对超限
`assert` 报错而非静默截断。

序号**不由数据顺序决定**，而由台账 `id_ledger.json` 固定，见第 4 节。

---

## 2. `tag` —— 4 字符可变标签

```
1  A3  N
│  │   └──── t[3]    奖项
│  └───────  t[1:2]  topic，2 位大写十六进制
└──────────  t[0]    论文类型
```

默认值 `000N`（类型未定、topic 未分类、无奖项）。

### 2.1 t[0] 论文类型

| 码 | 含义 |
| --- | --- |
| `0` | 待分析（默认值） |
| `1` | method design —— 设计某种方法解决某种问题 |
| `2` | measurement —— 测量研究 |
| `3` | benchmark |
| `4` | dataset —— 提出数据集 |
| `5` | survey |
| `6` | SoK（Systematization of Knowledge） |
| `7` | user study —— 用户研究、业内访谈 |
| `8` | 保留 |
| `9` | 不属于以上任何分类 |

类型按以下优先级取第一个命中的，其余留 `0`：

1. 标题以 `SoK` 开头 → `6`。这是定义性信号，压过一切
2. `official_cache/tag_cache.jsonl` 中 LLM 的判定（若非 `0`）
3. 已有 `categories` 按下列顺序取第一个命中：

   | 段 | 标签 → 码 |
   | --- | --- |
   | 特征性 | `survey`→`5`、`user study`/`user_study`/`human`→`7`、`measurement`→`2`、`benchmark`→`3`、`dataset`→`4` |
   | 末位兜底 | `attack`、`defense`、`approach`、`system`、`algorithm`、`implementation`、`tool`、`protocol` → `1` |

4. 标题含 `survey` → `5`
5. 否则 `0`

第 3 步排在第 4 步之前是有意的：*A Survey of Developers' Security Practices*
这类标题含 survey 的论文，实际上多半是 user study。LLM 读过摘要，标题正则没有。

**末位兜底那一段是有意放在最后的。** 单看 `approach`（8000 次）、`system`（6830 次）
区分度不足，但排在特征性标签之后就没有这个问题：一篇论文若不是 survey / SoK /
user study / measurement / benchmark / dataset，而它被标了 `approach`，那它就是
method design。这一段覆盖了存量产出的 78.7%，省下同等数量的 LLM 请求。

`empirical`（9324 次）是唯一被排除的高频标签：它描述的是研究方法而非贡献类型，
一篇 empirical 论文可能是 measurement 也可能是 user study，映射到任何一个都是猜。

### 2.2 t[1:2] topic

2 位大写十六进制，共 256 个码位。**按领域分段编址，第一位十六进制自带含义**：

| 范围 | 段 | 槽位 |
| --- | --- | --- |
| `00` | 未分类（默认值） | 1 |
| `01`–`7F` | 安全 | 127 |
| `80`–`BF` | 软件工程 | 64 |
| `C0`–`EF` | 系统与体系结构 | 48 |
| `F0`–`FE` | 保留 | 15 |
| `FF` | 不属于以上任何分类 | 1 |

分段是必需的，不是装饰：现有 LLM 产出把 ICSE/ISSTA 的 2996 篇论文硬塞进安全白名单
（"Automated security analysis of source code and binaries" 命中 1870 次），
SOSP/OSDI/ASPLOS 则完全没有对应 topic。

完整码表见第 3 节。

**一篇论文可能有多个 topic，ID 只放一个：取 `topics_en[0]`。**

码表连同中英文名由 `--analyze` 导出到 `src/assets/data/topics.json`
（`id_taxonomy.export_taxonomy()`）。前端显示的主题名、类型名只从那个文件读，
不在 i18n 里另存一份。

### 2.3 t[3] 奖项

| 码 | 含义 | `awards.json` 中的奖项名 |
| --- | --- | --- |
| `N` | 无（normal paper，默认值） | — |
| `D` | 最佳 / 杰出论文 | Distinguished Paper Award、Best Paper Award、Best Student Paper Award、Best Practical Paper Award |
| `H` | 荣誉提名 | Distinguished Paper Award Honorable Mentions |
| `T` | 时间检验奖 | Test of Time Award |
| `A` | 制品奖 | Distinguished Artifact Award、Artifact Evaluation Award |
| `P` | 海报及其他非论文奖 | Best/Distinguished (Technical) Poster (Presentation) Award、Best Post Award、AI-Selected "Best" Poster Award、Best Video / Screenplay / Film Editing Award |

一篇论文获多个奖时取优先级 **`T` > `D` > `H` > `A` > `P`**。

数据源为 `src/assets/data/awards.json`（390 条，覆盖 4 个会议），按
`publication` + `year` + `compact(title)` 匹配。此字段**不需要 LLM**，静态阶段即可
全部填好。

**时间检验奖是例外**：`awards.json` 对它记的是**获奖年份**而非论文的发表年份
（2025 年的 ToT 授予 2015 年的论文），按年份对齐会全部落空。这类奖项在
`id_taxonomy.YEAR_AGNOSTIC_AWARDS` 中登记，匹配时忽略年份、只在同一会议内按标题对齐。

390 条中约 86 条匹配不上，这是预期的：其中 36 条是海报（不是论文，本就不在数据集里），
其余多为 2026 年尚未收录的论文，以及授予 1987/1989 年论文的 ToT（数据集从 1994 年起）。

---

## 3. topic 完整码表

码表是 **append-only** 的：已分配的码值永不改动、永不复用，新 topic 只能取所在段的
下一个空位。一条测试断言码值唯一、且历史码未被修改。

### 3.1 安全段 `01`–`7F`

#### `01`–`0F` 系统与基础设施安全 · Systems and infrastructure security

| 码 | Topic | 中文 |
| --- | --- | --- |
| `01` | System security | 系统安全 |
| `02` | Operating systems security | 操作系统安全 |
| `03` | Distributed systems security | 分布式系统安全 |
| `04` | Cloud computing security | 云计算安全 |
| `05` | Security for cloud/edge computing | 云/边缘计算安全 |
| `06` | Embedded systems security | 嵌入式系统安全 |
| `07` | IoT security | 物联网安全 |
| `08` | Security for cyber-physical systems | 信息物理系统安全 |
| `09` | Security for large-scale critical infrastructures | 大规模关键基础设施安全 |
| `0A` | Security architectures | 安全体系结构 |
| `0B` | Trustworthy computing | 可信计算 |
| `0C` | Virtualization and container security | 虚拟化与容器安全 |
| `0D` | Storage and file system security | 存储与文件系统安全 |
| `0E` | VR/AR security | VR/AR 安全 |
| `0F` | Game security | 游戏安全 |

#### `10`–`1F` 网络与 Web 安全 · Network and web security

| 码 | Topic | 中文 |
| --- | --- | --- |
| `10` | Network security | 网络安全 |
| `11` | Network security measurement | 网络安全测量 |
| `12` | Network infrastructure security | 网络基础设施安全 |
| `13` | Intrusion detection and prevention | 入侵检测与防御 |
| `14` | Denial-of-service attacks and countermeasures | 拒绝服务攻击与对策 |
| `15` | Analysis of network and security protocols | 网络与安全协议分析 |
| `16` | Integrating security in network protocols | 网络协议的安全集成 |
| `17` | Network security policy implementation and management | 网络安全策略实施与管理 |
| `18` | Security for emerging networks | 新兴网络安全 |
| `19` | Security for future Internet architectures | 未来互联网架构安全 |
| `1A` | Wireless and mobile security/privacy | 无线与移动安全/隐私 |
| `1B` | Web security and privacy | Web 安全与隐私 |
| `1C` | Security of web-based applications and services | Web 应用与服务安全 |
| `1D` | Mobile security | 移动安全 |
| `1E` | Browser security | 浏览器安全 |
| `1F` | Software-defined networking security | 软件定义网络安全 |

#### `20`–`2F` 软件与程序分析安全 · Software and program analysis security

| 码 | Topic | 中文 |
| --- | --- | --- |
| `20` | Software security | 软件安全 |
| `21` | Automated security analysis of source code and binaries | 源代码与二进制的自动化安全分析 |
| `22` | Program and binary analysis | 程序与二进制分析 |
| `23` | Fuzzing and vulnerability discovery | 模糊测试与漏洞挖掘 |
| `24` | Software supply chain security | 软件供应链安全 |
| `25` | Malware analysis and unwanted software | 恶意软件分析与不良软件 |
| `26` | Anti-malware techniques | 反恶意软件技术 |
| `27` | Forensics and diagnostics for security | 安全取证与诊断 |
| `28` | Cyber-crime defense and forensics | 网络犯罪防御与取证 |
| `29` | Cyber attack prevention, detection, investigation, and response | 网络攻击的预防、检测、调查与响应 |
| `2A` | Attacks with novel insights, techniques, or results | 具有新见解、新技术或新结果的攻击 |
| `2B` | Memory safety and exploit mitigation | 内存安全与漏洞利用缓解 |
| `2C` | Reverse engineering | 逆向工程 |
| `2D` | Language-based security | 基于语言的安全 |
| `2E`–`2F` | 保留 | — |

#### `30`–`3F` 硬件与侧信道 · Hardware and side channels

| 码 | Topic | 中文 |
| --- | --- | --- |
| `30` | Hardware security | 硬件安全 |
| `31` | Secure computer architectures | 安全计算机体系结构 |
| `32` | Side channels | 侧信道 |
| `33` | Detection of malicious or counterfeit hardware | 恶意或伪造硬件检测 |
| `34` | Automated security analysis of hardware designs | 硬件设计的自动化安全分析 |
| `35` | Physical security | 物理安全 |
| `36`–`3F` | 保留 | — |

#### `40`–`4F` 密码学 · Cryptography

| 码 | Topic | 中文 |
| --- | --- | --- |
| `40` | Applied cryptography | 应用密码学 |
| `41` | Applications of cryptography | 密码学应用 |
| `42` | Analysis of deployed cryptography and protocols | 已部署密码系统与协议分析 |
| `43` | Cryptographic implementation analysis | 密码实现分析 |
| `44` | New cryptographic protocols with real-world applications | 面向实际应用的新密码协议 |
| `45` | Public key infrastructures and key management | 公钥基础设施与密钥管理 |
| `46` | Secure multi-party computation | 安全多方计算 |
| `47` | Information theory and security | 信息论与安全 |
| `48`–`4F` | 保留 | — |

#### `50`–`5F` 区块链与访问控制 · Blockchain and access control

| 码 | Topic | 中文 |
| --- | --- | --- |
| `50` | Blockchains and distributed ledger security | 区块链与分布式账本安全 |
| `51` | Security and privacy for blockchains and cryptocurrencies | 区块链与加密货币的安全与隐私 |
| `52` | Smart contract security | 智能合约安全 |
| `53` | Authentication, access control, and authorization | 认证、访问控制与授权 |
| `54`–`5F` | 保留 | — |

#### `60`–`6F` 隐私 · Privacy

| 码 | Topic | 中文 |
| --- | --- | --- |
| `60` | Privacy and anonymity | 隐私与匿名 |
| `61` | Privacy and anonymity in networks and distributed systems | 网络与分布式系统中的隐私与匿名 |
| `62` | Privacy-preserving computation | 隐私保护计算 |
| `63` | Privacy attacks | 隐私攻击 |
| `64` | Privacy metrics | 隐私度量 |
| `65` | Surveillance and censorship | 监控与审查 |
| `66` | Security and privacy metrics | 安全与隐私度量 |
| `67` | Social network security and privacy | 社交网络安全与隐私 |
| `68`–`6F` | 保留 | — |

#### `70`–`7F` 人因、机器学习与方法学 · Human factors, machine learning and methodology

| 码 | Topic | 中文 |
| --- | --- | --- |
| `70` | Human-centered security and privacy | 以人为中心的安全与隐私 |
| `71` | Usable security and privacy | 可用安全与隐私 |
| `72` | User studies for security and privacy | 安全与隐私的用户研究 |
| `73` | Security and privacy law, policy, and ethics | 安全与隐私的法律、政策与伦理 |
| `74` | Security education and training | 安全教育与培训 |
| `75` | Security for at-risk populations | 高风险人群的安全 |
| `76` | Understanding and mitigating information manipulation, disinformation, harassment, extremism, and abuse | 信息操纵、虚假信息、骚扰、极端主义与滥用的理解与缓解 |
| `77` | Economics of security and privacy | 安全与隐私经济学 |
| `78` | Formal methods and verification | 形式化方法与验证 |
| `79` | Program verification for security | 面向安全的程序验证 |
| `7A` | Security of machine learning | 机器学习安全 |
| `7B` | Privacy of machine learning | 机器学习隐私 |
| `7C` | ML integrity and availability | 机器学习的完整性与可用性 |
| `7D` | Attacks on ML systems | 针对机器学习系统的攻击 |
| `7E` | Verifying security and privacy properties of ML algorithms | 机器学习算法安全与隐私属性验证 |
| `7F` | Special problems and tradeoffs (security vs. efficiency/usability/cost/ethics) | 特殊问题与权衡（安全与效率/可用性/成本/伦理） |

### 3.2 软件工程段 `80`–`BF`

#### `80`–`8F` 测试与分析 · Testing and analysis

| 码 | Topic | 中文 |
| --- | --- | --- |
| `80` | Software testing | 软件测试 |
| `81` | Test generation and prioritization | 测试生成与优先级排序 |
| `82` | Static analysis and linting | 静态分析与代码检查 |
| `83` | Dynamic analysis and instrumentation | 动态分析与插桩 |
| `84` | Symbolic execution and constraint solving | 符号执行与约束求解 |
| `85` | Program verification and model checking | 程序验证与模型检验 |
| `86` | Automated program repair | 自动程序修复 |
| `87` | Fault localization and debugging | 缺陷定位与调试 |
| `88` | Bug and defect prediction | 缺陷预测 |
| `89` | Mutation testing | 变异测试 |
| `8A` | Concurrency and distributed system testing | 并发与分布式系统测试 |
| `8B` | GUI and end-to-end testing | GUI 与端到端测试 |
| `8C` | Performance analysis and profiling | 性能分析与剖析 |
| `8D` | Regression testing and continuous integration | 回归测试与持续集成 |
| `8E` | Flaky test analysis | 不稳定测试分析 |
| `8F` | Runtime verification and monitoring | 运行时验证与监控 |

#### `90`–`9F` 程序与代码 · Programs and code

| 码 | Topic | 中文 |
| --- | --- | --- |
| `90` | Program comprehension | 程序理解 |
| `91` | Code search and recommendation | 代码搜索与推荐 |
| `92` | Code clone detection | 代码克隆检测 |
| `93` | Refactoring | 重构 |
| `94` | Program synthesis | 程序合成 |
| `95` | Compilers and language implementation | 编译器与语言实现 |
| `96` | Type systems and language design | 类型系统与语言设计 |
| `97` | API design, usage and misuse | API 设计、使用与误用 |
| `98` | Configuration and build systems | 配置与构建系统 |
| `99` | Dependency and package management | 依赖与包管理 |
| `9A` | Code review | 代码评审 |
| `9B` | Version control and change analysis | 版本控制与变更分析 |
| `9C` | Technical debt and code smells | 技术债与代码异味 |
| `9D` | Documentation and comments | 文档与注释 |
| `9E` | Logging and observability | 日志与可观测性 |
| `9F` | Software architecture and design | 软件架构与设计 |

#### `A0`–`AF` 过程、人与 AI · Process, people and AI

| 码 | Topic | 中文 |
| --- | --- | --- |
| `A0` | Requirements engineering | 需求工程 |
| `A1` | Software process and project management | 软件过程与项目管理 |
| `A2` | Developer productivity and human factors | 开发者效率与人因 |
| `A3` | Empirical studies of developers | 开发者实证研究 |
| `A4` | Open source ecosystems and community | 开源生态与社区 |
| `A5` | Mining software repositories | 软件仓库挖掘 |
| `A6` | Software maintenance and evolution | 软件维护与演化 |
| `A7` | Software reuse | 软件复用 |
| `A8` | Software engineering education | 软件工程教育 |
| `A9` | Large language models for software engineering | 面向软件工程的大语言模型 |
| `AA` | Machine learning for software engineering | 面向软件工程的机器学习 |
| `AB` | Software engineering for machine learning systems | 机器学习系统的软件工程 |
| `AC` | AI code generation and programming assistants | AI 代码生成与编程助手 |
| `AD` | Benchmarks and datasets for software engineering | 软件工程基准与数据集 |
| `AE` | Software ecosystems and app stores | 软件生态与应用商店 |
| `AF` | Green and sustainable software | 绿色与可持续软件 |

#### `B0`–`BF` 领域与质量属性 · Domains and quality attributes

| 码 | Topic | 中文 |
| --- | --- | --- |
| `B0` | Mobile app analysis | 移动应用分析 |
| `B1` | Web application engineering | Web 应用工程 |
| `B2` | Cloud and microservice engineering | 云与微服务工程 |
| `B3` | DevOps and deployment | DevOps 与部署 |
| `B4` | Embedded and cyber-physical software | 嵌入式与信息物理软件 |
| `B5` | Blockchain and smart contract engineering | 区块链与智能合约工程 |
| `B6` | Quantum software engineering | 量子软件工程 |
| `B7` | Safety-critical software and certification | 安全关键软件与认证 |
| `B8` | Reliability and availability engineering | 可靠性与可用性工程 |
| `B9` | Usability and accessibility engineering | 可用性与无障碍工程 |
| `BA` | Software energy efficiency | 软件能效 |
| `BB` | Software licensing and legal issues | 软件许可与法律问题 |
| `BC` | Formal specification | 形式化规约 |
| `BD` | Software modeling and model-driven engineering | 软件建模与模型驱动工程 |
| `BE` | Software analytics | 软件分析学 |
| `BF` | 保留 | — |

### 3.3 系统段 `C0`–`EF`

#### `C0`–`CF` 操作系统与分布式 · Operating systems and distributed systems

| 码 | Topic | 中文 |
| --- | --- | --- |
| `C0` | Operating system design | 操作系统设计 |
| `C1` | Kernel and microkernel architecture | 内核与微内核架构 |
| `C2` | Virtualization and hypervisors | 虚拟化与虚拟机监控器 |
| `C3` | Containers and sandboxing | 容器与沙箱 |
| `C4` | Memory management | 内存管理 |
| `C5` | Scheduling | 调度 |
| `C6` | Concurrency and synchronization | 并发与同步 |
| `C7` | File systems | 文件系统 |
| `C8` | Storage systems | 存储系统 |
| `C9` | Persistent memory | 持久内存 |
| `CA` | I/O and device drivers | I/O 与设备驱动 |
| `CB` | Serverless and cloud runtimes | 无服务器与云运行时 |
| `CC` | Distributed systems | 分布式系统 |
| `CD` | Consensus and replication | 共识与复制 |
| `CE` | Fault tolerance and reliability | 容错与可靠性 |
| `CF` | Formal verification of systems | 系统形式化验证 |

#### `D0`–`DF` 网络与体系结构 · Networking and architecture

| 码 | Topic | 中文 |
| --- | --- | --- |
| `D0` | Datacenter networking | 数据中心网络 |
| `D1` | Network stacks and RDMA | 网络协议栈与 RDMA |
| `D2` | Computer architecture | 计算机体系结构 |
| `D3` | Memory and cache hierarchy | 内存与缓存层次 |
| `D4` | Accelerators and heterogeneous computing | 加速器与异构计算 |
| `D5` | GPU systems | GPU 系统 |
| `D6` | Interconnects and network-on-chip | 互连与片上网络 |
| `D7` | Processor microarchitecture | 处理器微架构 |
| `D8` | Near-data and in-memory processing | 近数据与存内计算 |
| `D9` | Non-volatile and emerging memory | 非易失与新型存储器 |
| `DA` | Energy and power management | 能耗与功耗管理 |
| `DB` | Reconfigurable computing and FPGA | 可重构计算与 FPGA |
| `DC` | Quantum computing systems | 量子计算系统 |
| `DD` | Compilers and runtime systems | 编译器与运行时系统 |
| `DE` | Binary translation and emulation | 二进制翻译与仿真 |
| `DF` | Hardware/software co-design | 软硬件协同设计 |

#### `E0`–`EF` 应用系统 · Application systems

| 码 | Topic | 中文 |
| --- | --- | --- |
| `E0` | Machine learning systems | 机器学习系统 |
| `E1` | LLM serving and inference systems | 大模型推理服务系统 |
| `E2` | Training systems and parallelism | 训练系统与并行 |
| `E3` | Data processing and analytics systems | 数据处理与分析系统 |
| `E4` | Database systems | 数据库系统 |
| `E5` | Key-value stores and caching | 键值存储与缓存 |
| `E6` | Graph processing systems | 图处理系统 |
| `E7` | Stream processing | 流处理 |
| `E8` | Edge and mobile systems | 边缘与移动系统 |
| `E9` | Real-time systems | 实时系统 |
| `EA` | Blockchain systems | 区块链系统 |
| `EB` | Trusted execution environments | 可信执行环境 |
| `EC` | System performance measurement | 系统性能测量 |
| `ED` | Tracing, debugging and diagnosis for systems | 系统追踪、调试与诊断 |
| `EE` | Benchmarks and workload characterization | 基准测试与负载特征分析 |
| `EF` | Resource management and scheduling policies | 资源管理与调度策略 |

### 3.4 别名表

`llm_analyzer.py` 的 `_validate_schema` 长期被注释掉（见 `analyzers/llm_analyzer.py:295`），
已有 11269 条产出中的 topic 串漂出了白名单：白名单 75 个，实际出现 136 个，其中
61 个不在白名单内。这 61 个里有 8 个只是规范名的大小写变体
（如 `Denial-of-Service…` vs `Denial-of-service…`）—— 查表本身大小写无关，
不需要别名。剩下 53 个需要归并：

| 出现次数 | 原串 | → 码 |
| --- | --- | --- |
| 504 | `Other` | `FF` |
| 49 | `Trusted computing` | `0B` |
| 14 | `Cyber-physical systems security` | `08` |
| 13 | `Cyber-physical systems` | `08` |
| 9 | `Security metrics` | `66` |
| 6 | `Security for web-based applications and services` | `1C` |
| 6 | `Cyber attack prevention, detection, investigation, and reference` | `29` |
| 5 | `Adversarial machine learning` | `7D` |
| 4 | `Security and privacy for large-scale critical infrastructures` | `09` |
| 4 | `Vulnerability discovery` | `23` |
| 3 | `Malware analysis and unwanter software` | `25` |
| 3 | `Security and privacy policy` | `73` |
| 2 | `Security measurement` | `66` |
| 2 | `Cyber attack prevention, detection, investigation, and conversion` | `29` |
| 2 | `Security and privacy policy implementation and management` | `17` |
| 2 | `Exploit mitigations` | `2B` |
| 2 | `Safety` | `FF` |
| 2 | `Virtualization security` | `0C` |
| 2 | `Security and privacy for at-risk populations` | `75` |
| 2 | `Security and privacy for cyber-physical systems` | `08` |
| 1 | `Malware analysis andহীনunwanted software` | `25` |
| 1 | `Smart home security` | `07` |
| 1 | `Secure architectures` | `0A` |
| 1 | `Storage system security` | `0D` |
| 1 | `Security of cyber-physical systems` | `08` |
| 1 | `Smart contracts` | `52` |
| 1 | `Secure computation` | `46` |
| 1 | `Content moderation` | `76` |
| 1 | `Measurement studies` | `66` |
| 1 | `Security for edge computing` | `05` |
| 1 | `Memory safety` | `2B` |
| 1 | `Graph-based Security and Privacy Analytics` | `FF` |
| 1 | `Dynamic analysis` | `22` |
| 1 | `Social engineering` | `76` |
| 1 | `Measurement of malware and unwanted software` | `25` |
| 1 | `Access control` | `53` |
| 1 | `Adversarial examples` | `7D` |
| 1 | `Adversarial purification` | `7D` |
| 1 | `Critical infrastructure security` | `09` |
| 1 | `Smart contracts security` | `52` |
| 1 | `Forensics and diagnostics forво` | `27` |
| 1 | `Adversarial patch defenses` | `7D` |
| 1 | `Social network security` | `67` |
| 1 | `Internet security policies` | `17` |
| 1 | `Mobile security/privacy` | `1A` |
| 1 | `Storage security` | `0D` |
| 1 | `Security and privacy measurement` | `66` |
| 1 | `Security for machine learning` | `7A` |
| 1 | `Multi-party computation` | `46` |
| 1 | `Smart contracts and decentralized applications security` | `52` |
| 1 | `Measurement of privacy leakage` | `63` |
| 1 | `Adversarial learning` | `7D` |
| 1 | `Botnets` | `25` |

表中 `Malware analysis andহীনunwanted software` 与 `Forensics and diagnostics forво`
的乱码字符是模型产出里真实存在的，不是本文档的排版错误 —— 别名匹配按字面进行，
不要"修正"它们。

匹配一律走大小写无关、空白折叠的规范化形式。表中查不到的串 → `FF`。

> **本表与 `analyzers/id_taxonomy.py` 必须一致。**
> `tests/test_id_taxonomy.py` 会重新解析本文档的第 3 节并逐条比对，
> 改了一边忘了另一边会让测试变红。

---

## 4. 台账 `id_ledger.json`

场内序号一旦分配就**永不改变**，靠仓库根目录的 `id_ledger.json` 保证。

> 台账**必须放在仓库根目录并进 git**。`official_cache/` 被 `.gitignore:6` 忽略，
> `private_source.zip` 也没进版本控制 —— 台账放那里等于换台机器就重算，失去意义。

### 4.1 格式

```json
{
  "USENIX Sec": {
    "2025": {
      "aformalanalysisof…": 1,
      "papertitleunderembargo": 2,
      "papertitleunderembargo#httpswwwusenixorg…shen": 3
    }
  }
}
```

`json.dump(..., indent=1, sort_keys=True, ensure_ascii=False)` —— 键有序，追加时
git diff 只有新增行。约 1 MB。

### 4.2 分配算法

对每个 `(publication, year)` 分组，组内论文先按 `(compact(title), compact(paper))`
排序以保证确定性，然后逐篇：

1. 候选键依次为 `compact(title)`、`compact(title) + "#" + compact(paper)`
2. 取第一个「台账中已存在 **且** 本轮尚未被其他论文占用」的候选键 → 沿用其序号
3. 若都没有 → 取第一个「台账中不存在」的候选键，分配 `该场次现有最大序号 + 1`，写入台账

`compact()` 沿用 `main.py:469` 的定义：去掉所有非字母数字字符后转小写。

### 4.3 为什么需要两级候选键

单场次内确实存在重名标题：

- **USENIX Sec 2026** 有 4 篇标题都是 `Paper Title Under Embargo`（尚未解禁），
  只有 URL 不同。
- **NDSS 2022** 有 2 组同名论文，每组中有一篇指向 `auto-draft-NNN` 占位页。

两级候选键让它们各拿各的号。而当 NDSS 把 `auto-draft` URL 修正成正式 slug 时，
第 1 级的标题键先命中，ID 不受影响 —— 这正是"标题稳定、URL 会变"的现实。

USENIX 论文解禁后标题变化，会被当作新论文分配新号，原占位条目成为台账中的孤儿。
孤儿无害，不做清理。

---

## 5. 与前端的契约

- `id` 是字符串。`src/lib/papers.js` 里的 `a.id - b.id` 必须换成字符串比较 ——
  数值减法作用于字符串会得到 `NaN`，`sort` 比较器返回 `NaN` 会静默退化，**不报错**。
- `favorites`（IndexedDB `spc-settings` / `config` / `favorites`）的主键就是 `id`。
  旧的数字 ID 收藏在迁移时直接丢弃：读取时过滤掉非字符串项。
- 展示列 `.c-id` 需容纳 7 字符。
- `tag` 进数据文件，但当前**不做展示与筛选 UI**。

---

## 6. 变更影响

改造后首次 `--analyze`：134 个 `meta_json` 全部变更（`id` 字段整体替换）→ 全量上传一次。

此后：

| 操作 | 受影响的 meta_json |
| --- | --- |
| 新增会议年份 | 1 个 |
| 跑 `--llm-tag` | 被填了 tag 的那些场次 |
| 往旧年份补录论文 | 1 个 |
| 重跑爬虫 / 重新导出官方 CSV | 0 个（顺序变化不再影响 ID） |

---

## 7. 首次实施后的实际状态（2026-07-27）

16382 篇论文、134 个场次、11 个会议，ID 全部唯一，连跑三次字节一致。

**tag 静态覆盖率**

| 段 | 已填 | 说明 |
| --- | --- | --- |
| 类型 t[0] | 56.0% | method design 7476、measurement 1263、user study 185、survey 148、SoK 105 |
| topic t[1:2] | 57.9% | 全部落在安全段 |
| 奖项 t[3] | 309 篇 | D 272、A 20、H 7、T 5、P 5 |

**软工段（`80`–`BF`）与系统段（`C0`–`EF`）目前一篇都没用上。** 这是预期的：现有
topic 数据全部来自 `--llm-analyze` 的存量产出，而那时的白名单只有安全类，ICSE/ISSTA
的论文被硬塞进了安全 topic，ASE/FSE/SOSP/ASPLOS/OSDI 则完全没有分析过。这两段要等
`--llm-tag` 带着新码表跑过才会被填上 —— 这正是当初必须分段的原因。

剩余 7082 篇需要 LLM 调用。`uv run main.py --llm-tag --llm-tag-limit 0` 可以在不发
任何请求的情况下重新数一遍。
