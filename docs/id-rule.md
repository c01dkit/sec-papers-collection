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

#### `01`–`0F` 系统与基础设施安全

| 码 | Topic |
| --- | --- |
| `01` | System security |
| `02` | Operating systems security |
| `03` | Distributed systems security |
| `04` | Cloud computing security |
| `05` | Security for cloud/edge computing |
| `06` | Embedded systems security |
| `07` | IoT security |
| `08` | Security for cyber-physical systems |
| `09` | Security for large-scale critical infrastructures |
| `0A` | Security architectures |
| `0B` | Trustworthy computing |
| `0C` | Virtualization and container security |
| `0D` | Storage and file system security |
| `0E` | VR/AR security |
| `0F` | Game security |

#### `10`–`1F` 网络与 Web 安全

| 码 | Topic |
| --- | --- |
| `10` | Network security |
| `11` | Network security measurement |
| `12` | Network infrastructure security |
| `13` | Intrusion detection and prevention |
| `14` | Denial-of-service attacks and countermeasures |
| `15` | Analysis of network and security protocols |
| `16` | Integrating security in network protocols |
| `17` | Network security policy implementation and management |
| `18` | Security for emerging networks |
| `19` | Security for future Internet architectures |
| `1A` | Wireless and mobile security/privacy |
| `1B` | Web security and privacy |
| `1C` | Security of web-based applications and services |
| `1D` | Mobile security |
| `1E` | Browser security |
| `1F` | Software-defined networking security |

#### `20`–`2F` 软件与程序分析安全

| 码 | Topic |
| --- | --- |
| `20` | Software security |
| `21` | Automated security analysis of source code and binaries |
| `22` | Program and binary analysis |
| `23` | Fuzzing and vulnerability discovery |
| `24` | Software supply chain security |
| `25` | Malware analysis and unwanted software |
| `26` | Anti-malware techniques |
| `27` | Forensics and diagnostics for security |
| `28` | Cyber-crime defense and forensics |
| `29` | Cyber attack prevention, detection, investigation, and response |
| `2A` | Attacks with novel insights, techniques, or results |
| `2B` | Memory safety and exploit mitigation |
| `2C` | Reverse engineering |
| `2D` | Language-based security |
| `2E`–`2F` | 保留 |

#### `30`–`3F` 硬件与侧信道

| 码 | Topic |
| --- | --- |
| `30` | Hardware security |
| `31` | Secure computer architectures |
| `32` | Side channels |
| `33` | Detection of malicious or counterfeit hardware |
| `34` | Automated security analysis of hardware designs |
| `35` | Physical security |
| `36`–`3F` | 保留 |

#### `40`–`4F` 密码学

| 码 | Topic |
| --- | --- |
| `40` | Applied cryptography |
| `41` | Applications of cryptography |
| `42` | Analysis of deployed cryptography and protocols |
| `43` | Cryptographic implementation analysis |
| `44` | New cryptographic protocols with real-world applications |
| `45` | Public key infrastructures and key management |
| `46` | Secure multi-party computation |
| `47` | Information theory and security |
| `48`–`4F` | 保留 |

#### `50`–`5F` 区块链与访问控制

| 码 | Topic |
| --- | --- |
| `50` | Blockchains and distributed ledger security |
| `51` | Security and privacy for blockchains and cryptocurrencies |
| `52` | Smart contract security |
| `53` | Authentication, access control, and authorization |
| `54`–`5F` | 保留 |

#### `60`–`6F` 隐私

| 码 | Topic |
| --- | --- |
| `60` | Privacy and anonymity |
| `61` | Privacy and anonymity in networks and distributed systems |
| `62` | Privacy-preserving computation |
| `63` | Privacy attacks |
| `64` | Privacy metrics |
| `65` | Surveillance and censorship |
| `66` | Security and privacy metrics |
| `67` | Social network security and privacy |
| `68`–`6F` | 保留 |

#### `70`–`7F` 人因、机器学习与方法学

| 码 | Topic |
| --- | --- |
| `70` | Human-centered security and privacy |
| `71` | Usable security and privacy |
| `72` | User studies for security and privacy |
| `73` | Security and privacy law, policy, and ethics |
| `74` | Security education and training |
| `75` | Security for at-risk populations |
| `76` | Understanding and mitigating information manipulation, disinformation, harassment, extremism, and abuse |
| `77` | Economics of security and privacy |
| `78` | Formal methods and verification |
| `79` | Program verification for security |
| `7A` | Security of machine learning |
| `7B` | Privacy of machine learning |
| `7C` | ML integrity and availability |
| `7D` | Attacks on ML systems |
| `7E` | Verifying security and privacy properties of ML algorithms |
| `7F` | Special problems and tradeoffs (security vs. efficiency/usability/cost/ethics) |

### 3.2 软件工程段 `80`–`BF`

#### `80`–`8F` 测试与分析

| 码 | Topic |
| --- | --- |
| `80` | Software testing |
| `81` | Test generation and prioritization |
| `82` | Static analysis and linting |
| `83` | Dynamic analysis and instrumentation |
| `84` | Symbolic execution and constraint solving |
| `85` | Program verification and model checking |
| `86` | Automated program repair |
| `87` | Fault localization and debugging |
| `88` | Bug and defect prediction |
| `89` | Mutation testing |
| `8A` | Concurrency and distributed system testing |
| `8B` | GUI and end-to-end testing |
| `8C` | Performance analysis and profiling |
| `8D` | Regression testing and continuous integration |
| `8E` | Flaky test analysis |
| `8F` | Runtime verification and monitoring |

#### `90`–`9F` 程序与代码

| 码 | Topic |
| --- | --- |
| `90` | Program comprehension |
| `91` | Code search and recommendation |
| `92` | Code clone detection |
| `93` | Refactoring |
| `94` | Program synthesis |
| `95` | Compilers and language implementation |
| `96` | Type systems and language design |
| `97` | API design, usage and misuse |
| `98` | Configuration and build systems |
| `99` | Dependency and package management |
| `9A` | Code review |
| `9B` | Version control and change analysis |
| `9C` | Technical debt and code smells |
| `9D` | Documentation and comments |
| `9E` | Logging and observability |
| `9F` | Software architecture and design |

#### `A0`–`AF` 过程、人与 AI

| 码 | Topic |
| --- | --- |
| `A0` | Requirements engineering |
| `A1` | Software process and project management |
| `A2` | Developer productivity and human factors |
| `A3` | Empirical studies of developers |
| `A4` | Open source ecosystems and community |
| `A5` | Mining software repositories |
| `A6` | Software maintenance and evolution |
| `A7` | Software reuse |
| `A8` | Software engineering education |
| `A9` | Large language models for software engineering |
| `AA` | Machine learning for software engineering |
| `AB` | Software engineering for machine learning systems |
| `AC` | AI code generation and programming assistants |
| `AD` | Benchmarks and datasets for software engineering |
| `AE` | Software ecosystems and app stores |
| `AF` | Green and sustainable software |

#### `B0`–`BF` 领域与质量属性

| 码 | Topic |
| --- | --- |
| `B0` | Mobile app analysis |
| `B1` | Web application engineering |
| `B2` | Cloud and microservice engineering |
| `B3` | DevOps and deployment |
| `B4` | Embedded and cyber-physical software |
| `B5` | Blockchain and smart contract engineering |
| `B6` | Quantum software engineering |
| `B7` | Safety-critical software and certification |
| `B8` | Reliability and availability engineering |
| `B9` | Usability and accessibility engineering |
| `BA` | Software energy efficiency |
| `BB` | Software licensing and legal issues |
| `BC` | Formal specification |
| `BD` | Software modeling and model-driven engineering |
| `BE` | Software analytics |
| `BF` | 保留 |

### 3.3 系统段 `C0`–`EF`

#### `C0`–`CF` 操作系统与分布式

| 码 | Topic |
| --- | --- |
| `C0` | Operating system design |
| `C1` | Kernel and microkernel architecture |
| `C2` | Virtualization and hypervisors |
| `C3` | Containers and sandboxing |
| `C4` | Memory management |
| `C5` | Scheduling |
| `C6` | Concurrency and synchronization |
| `C7` | File systems |
| `C8` | Storage systems |
| `C9` | Persistent memory |
| `CA` | I/O and device drivers |
| `CB` | Serverless and cloud runtimes |
| `CC` | Distributed systems |
| `CD` | Consensus and replication |
| `CE` | Fault tolerance and reliability |
| `CF` | Formal verification of systems |

#### `D0`–`DF` 网络与体系结构

| 码 | Topic |
| --- | --- |
| `D0` | Datacenter networking |
| `D1` | Network stacks and RDMA |
| `D2` | Computer architecture |
| `D3` | Memory and cache hierarchy |
| `D4` | Accelerators and heterogeneous computing |
| `D5` | GPU systems |
| `D6` | Interconnects and network-on-chip |
| `D7` | Processor microarchitecture |
| `D8` | Near-data and in-memory processing |
| `D9` | Non-volatile and emerging memory |
| `DA` | Energy and power management |
| `DB` | Reconfigurable computing and FPGA |
| `DC` | Quantum computing systems |
| `DD` | Compilers and runtime systems |
| `DE` | Binary translation and emulation |
| `DF` | Hardware/software co-design |

#### `E0`–`EF` 应用系统

| 码 | Topic |
| --- | --- |
| `E0` | Machine learning systems |
| `E1` | LLM serving and inference systems |
| `E2` | Training systems and parallelism |
| `E3` | Data processing and analytics systems |
| `E4` | Database systems |
| `E5` | Key-value stores and caching |
| `E6` | Graph processing systems |
| `E7` | Stream processing |
| `E8` | Edge and mobile systems |
| `E9` | Real-time systems |
| `EA` | Blockchain systems |
| `EB` | Trusted execution environments |
| `EC` | System performance measurement |
| `ED` | Tracing, debugging and diagnosis for systems |
| `EE` | Benchmarks and workload characterization |
| `EF` | Resource management and scheduling policies |

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
