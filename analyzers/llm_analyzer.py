import json
import os
import traceback
import re
import datetime
from typing import Any, Dict, List
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL=os.getenv("MODEL", "gpt-4o-mini")
BASE_URL=os.getenv("BASE_URL", "https://api.openai.com/v1")

if not OPENAI_API_KEY:
    raise EnvironmentError("OPENAI_API_KEY is not set in the environment.")



client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url=BASE_URL,
)

_APPROVED_TOPICS_EN: List[str] = [
    "System security",
    "Operating systems security",
    "Distributed systems security",
    "Cloud computing security",
    "Network security",
    "Network security measurement",
    "Intrusion detection and prevention",
    "Network infrastructure security",
    "Denial-of-service attacks and countermeasures",
    "Wireless and mobile security/privacy",
    "Analysis of network and security protocols",
    "Web security and privacy",
    "Mobile security",
    "IoT security",
    "VR/AR security",
    "Game security",
    "Software security",
    "Malware analysis and unwanted software",
    "Forensics and diagnostics for security",
    "Automated security analysis of source code and binaries",
    "Program and binary analysis",
    "Fuzzing and vulnerability discovery",
    "Software supply chain security",
    "Security architectures",
    "Security for cloud/edge computing",
    "Security for emerging networks",
    "Security for future Internet architectures",
    "Security for large-scale critical infrastructures",
    "Security for cyber-physical systems",
    "Embedded systems security",
    "Hardware security",
    "Secure computer architectures",
    "Detection of malicious or counterfeit hardware",
    "Side channels",
    "Automated security analysis of hardware designs",
    "Trustworthy computing",
    "Applications of cryptography",
    "Applied cryptography",
    "Analysis of deployed cryptography and protocols",
    "Cryptographic implementation analysis",
    "New cryptographic protocols with real-world applications",
    "Blockchains and distributed ledger security",
    "Security and privacy for blockchains and cryptocurrencies",
    "Public key infrastructures and key management",
    "Authentication, access control, and authorization",
    "Attacks with novel insights, techniques, or results",
    "Cyber attack prevention, detection, investigation, and response",
    "Cyber-crime defense and forensics",
    "Integrating security in network protocols",
    "Network security policy implementation and management",
    "Privacy and anonymity in networks and distributed systems",
    "Privacy and anonymity",
    "Privacy metrics",
    "Privacy-preserving computation",
    "Privacy attacks",
    "Surveillance and censorship",
    "Security and privacy metrics",
    "Human-centered security and privacy",
    "Usable security and privacy",
    "Security and privacy law, policy, and ethics",
    "Security education and training",
    "Security for at-risk populations",
    "Understanding and mitigating information manipulation, disinformation, harassment, extremism, and abuse",
    "User studies for security and privacy",
    "Economics of security and privacy",
    "Formal methods and verification",
    "Program verification for security",
    "Security of machine learning",
    "Privacy of machine learning",
    "ML integrity and availability",
    "Attacks on ML systems",
    "Verifying security and privacy properties of ML algorithms",
    "Security of web-based applications and services",
    "Anti-malware techniques",
    "Special problems and tradeoffs (security vs. efficiency/usability/cost/ethics)",
]

_APPROVED_TOPICS_SET = set(_APPROVED_TOPICS_EN)

_SYSTEM_MESSAGE = (
    "You are an expert research analyst focusing on top-tier computer security venues "
    "Given a paper title and abstract, produce a JSON object that strictly matches the schema. "
    "All strings must be double-quoted, output must be valid JSON, and bilingual elements "
    "must be accurate and fluent. "
    "For topics_en you MUST choose one or more entries exclusively from the Approved Security "
    "Topic Taxonomy listed below (exact spelling). For topics_zh, provide precise Chinese "
    "translations of the selected topics. If no topics match, you should use 'Other' as the topic.\n\n"
    "Approved Security Topic Taxonomy:\n"
    + ", ".join(_APPROVED_TOPICS_EN)
)

_FEW_SHOT_EXAMPLES: List[Dict[str, Any]] = [
    {
        "user": {
            "title": "Spectector: Principled Detection of Speculative Information Flows",
            "abstract": (
                "Since the advent of Spectre, a number of counter-measures have been proposed and deployed. Rigorously reasoning about their effectiveness, however, requires a well-defined notion of security against speculative execution attacks, which has been missing until now.In this paper (1) we put forward speculative non-interference, the first semantic notion of security against speculative execution attacks, and (2) we develop Spectector, an algorithm based on symbolic execution to automatically prove speculative non-interference, or to detect violations.We implement Spectector in a tool, which we use to detect subtle leaks and optimizations opportunities in the way major compilers place Spectre countermeasures. A scalability analysis indicates that checking speculative non-interference does not exhibit fundamental bottlenecks beyond those inherited by symbolic execution."
            ),
        },
        "assistant": {
            "title_en": "Spectector: Principled Detection of Speculative Information Flows",
            "title_zh": "Spectector：推测性信息流的原则化检测",
            "topics_en": ["Side channels", "Hardware security", "Program and binary analysis", "Formal methods and verification", "Automated security analysis of source code and binaries"],
            "topics_zh": ["侧信道", "硬件安全", "程序与二进制分析", "形式化方法与验证", "源代码与二进制代码的自动化安全分析"],
            "abstract_zh": "自Spectre出现以来，已有许多对策被提出和部署。然而，要严谨地推断其有效性，需要一个针对推测执行攻击的明确安全定义，而这一点至今仍然缺失。本文(1)提出了“推测性非干涉性”（speculative non-interference），这是首个针对推测执行攻击的语义安全概念；(2)开发了Spectector，这是一种基于符号执行的算法，用于自动证明推测性非干涉性或检测违规行为。我们将Spectector实现为一个工具，并使用它检测主流编译器在放置Spectre对策时存在的微妙泄漏和优化机会。可扩展性分析表明，检查推测性非干涉性除了继承自符号执行的瓶颈外，并没有表现出根本性的瓶颈。",
            "problem_en": "How to rigorously reason about the effectiveness of countermeasures against speculative execution attacks like Spectre?",
            "problem_zh": "如何严谨地推断针对Spectre等推测执行攻击的对策的有效性？",
            "target": "speculative execution attacks",
            "approach_en": "symbolic execution algorithm (Spectector)",
            "approach_zh": "符号执行算法 (Spectector)",
            "categories": ["approach", "system", "formal", "empirical"],
        },
    },
    {
        "user": {
            "title": "Are anonymity-seekers just like everybody else? An analysis of contributions to Wikipedia from Tor",
            "abstract": "User-generated content sites routinely block contributions from users of privacy-enhancing proxies like Tor because of a perception that proxies are a source of vandalism, spam, and abuse. Although these blocks might be effective, collateral damage in the form of unrealized valuable contributions from anonymity seekers is invisible. One of the largest and most important user-generated content sites, Wikipedia, has attempted to block contributions from Tor users since as early as 2005. We demonstrate that these blocks have been imperfect and that thousands of attempts to edit on Wikipedia through Tor have been successful. We draw upon several data sources and analytical techniques to measure and describe the history of Tor editing on Wikipedia over time and to compare contributions from Tor users to those from other groups of Wikipedia users. Our analysis suggests that although Tor users who slip through Wikipedia's ban contribute content that is more likely to be reverted and to revert others, their contributions are otherwise similar in quality to those from other unregistered participants and to the initial contributions of registered users.",
        },
        "assistant": {
            "title_en": "Are anonymity-seekers just like everybody else? An analysis of contributions to Wikipedia from Tor",
            "title_zh": "寻求匿名者是否与常人无异？对Tor用户维基百科贡献的分析",
            "topics_en": ["Privacy and anonymity", "Surveillance and censorship", "Understanding and mitigating information manipulation, disinformation, harassment, extremism, and abuse"],
            "topics_zh": ["隐私与匿名", "监控与审查", "理解和缓解信息操纵、虚假信息、骚扰、极端主义和滥用"],
            "abstract_zh": "用户生成内容网站通常会屏蔽来自Tor等隐私增强代理用户的贡献，因为人们认为代理是破坏、垃圾邮件和滥用的来源。虽然这些屏蔽措施可能有效，但以寻求匿名者未实现的有价值贡献为形式的附带损害却是不可见的。维基百科作为最大和最重要的用户生成内容网站之一，早在2005年就试图屏蔽Tor用户的贡献。我们证明这些屏蔽措施并不完美，并且有数千次通过Tor编辑维基百科的尝试获得了成功。我们利用多个数据源和分析技术来衡量和描述Tor用户在维基百科上的编辑历史，并比较Tor用户与其他维基百科用户群体的贡献。我们的分析表明，尽管绕过维基百科禁令的Tor用户贡献的内容更容易被回退或回退他人，但其贡献质量在其他方面与其他未注册参与者以及注册用户的初始贡献相似。",
            "problem_en": "Are the contributions of Tor users to Wikipedia inherently more malicious or lower quality than other users, justifying blanket bans?",
            "problem_zh": "Tor用户对维基百科的贡献是否本质上比其他用户更具恶意或质量更低，从而证明全面禁令的合理性？",
            "target": "Wikipedia contributions from Tor",
            "approach_en": "Data analysis of historical edits",
            "approach_zh": "历史编辑数据分析",
            "categories": ["empirical", "measurement"],
        },
    },
]

def extract_json_from_content_safe(content: str) -> dict:
    """
    Extract JSON data from text content.

    We thank @Anthropic at https://github.com/anthropics/claude-code-security-review/blob/c51ac4fce843683a8c6ba9e63bc47efcbce3da30/claudecode/json_parser.py#L12 for this function.
    :param content:
    :return:
    """
    try:
        # First, try to extract JSON from markdown code blocks (with or without language tag)
        json_matches = [
            re.search(r'```json\s*(.*?)\s*```', content, flags = re.DOTALL),
            re.search(r'```\s*(\{.*?\})\s*```', content, flags = re.DOTALL)
        ]

        for json_match in json_matches:
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    continue

        # If no JSON found in code blocks, try to find JSON objects anywhere in the text
        # Find all potential JSON objects (looking for balanced braces)
        brace_count = 0
        json_start = -1
        for i, char in enumerate(content):
            if char == '{':
                if brace_count == 0:
                    json_start = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and json_start != -1:
                    # Found a complete JSON object
                    potential_json = content[json_start:i + 1]
                    try:
                        return json.loads(potential_json)
                    except json.JSONDecodeError:
                        # This wasn't valid JSON, continue looking
                        continue
    except Exception:
        traceback.print_exc()
        pass

    return {}

def _build_messages(title: str, abstract: str) -> List[Dict[str, Any]]:
    messages: List[Dict[str, Any]] = [{"role": "system", "content": _SYSTEM_MESSAGE}]
    instruction = (
        "Title:\n{title}\n\nAbstract:\n{abstract}\n\n"
        "Output ONLY the JSON object with the specified schema."
    )
    for example in _FEW_SHOT_EXAMPLES:
        messages.append(
            {
                "role": "user",
                "content": instruction.format(
                    title=example["user"]["title"], abstract=example["user"]["abstract"]
                ),
            }
        )
        messages.append(
            {
                "role": "assistant",
                "content": json.dumps(example["assistant"], ensure_ascii=False),
            }
        )
    messages.append(
        {
            "role": "user",
            "content": instruction.format(title=title, abstract=abstract),
        }
    )
    return messages


def analyze_title_and_abs(title: str, abstract: str) -> Dict[str, Any]:
    if not title or not abstract:
        raise ValueError("Both title and abstract must be provided.")

    messages = _build_messages(title.strip(), abstract.strip())

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=1,
        )
    except Exception as exc:
        raise RuntimeError(f"OpenAI API request failed: {exc}") from exc

    try:
        content = completion.choices[0].message.content
    except (AttributeError, IndexError):
        raise RuntimeError("Received an unexpected response structure from OpenAI.")

    if not content:
        raise RuntimeError("OpenAI returned empty content.")

    try:
        parsed = extract_json_from_content_safe(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model output was not valid JSON: {exc}\nRaw output:\n{content}")

    # _validate_schema(parsed)
    parsed["model_used"] = MODEL
    parsed["date"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return parsed


def _validate_schema(payload: Dict[str, Any]) -> None:
    required_keys = [
        "title_en",
        "title_zh",
        "topics_en",
        "topics_zh",
        "abstract_zh",
        "problem_en",
        "problem_zh",
        "target",
        "approach_en",
        "approach_zh",
        "categories",
    ]
    missing = [key for key in required_keys if key not in payload]
    if missing:
        raise ValueError(f"Missing required keys in model response: {missing}")

    list_keys = ["topics_en", "topics_zh", "categories"]
    for key in list_keys:
        if not isinstance(payload[key], list):
            raise ValueError(f"{key} must be a list.")

    if len(payload["topics_en"]) != len(payload["topics_zh"]):
        raise ValueError("topics_en and topics_zh must have the same length.")

    invalid_topics = [
        topic for topic in payload["topics_en"] if topic not in _APPROVED_TOPICS_SET
    ]
    if invalid_topics:
        raise ValueError(
            "topics_en contains entries outside the approved taxonomy: "
            + ", ".join(invalid_topics)
        )