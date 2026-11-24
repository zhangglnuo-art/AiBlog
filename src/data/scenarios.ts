import { allModels, type AIModel, formatContext, formatPrice } from './models';

export interface ScenarioGuide {
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  intro: string;
  selectionTips: string[];
  relatedPosts: { title: string; href: string }[];
  faqs: { q: string; a: string }[];
  /** 判断模型是否适合该场景，并返回 0-100 的场景适配分 + 专属推荐理由 */
  evaluate: (m: AIModel) => { matched: boolean; score: number; reason: string };
}

function normalizeElo(elo: number): number {
  return Math.max(60, Math.min(100, ((elo - 1420) / 115) * 40 + 60));
}

function priceAdvantage(m: AIModel): number {
  const p = m.blendedPricePerM ?? 5;
  if (p <= 0.2) return 100;
  if (p <= 0.6) return 92;
  if (p <= 1.5) return 84;
  if (p <= 3) return 75;
  if (p <= 6) return 66;
  return 55;
}

export const SCENARIOS: ScenarioGuide[] = [
  {
    slug: 'writing',
    name: '写文章 / 润色 / 公众号创作',
    shortName: '写文章 / 文案',
    icon: '✍️',
    tagline: '文风自然、低 AI 味、中文逻辑连贯',
    seoTitle: '2026 写文章与文案最好用的 AI 大模型排行榜与价格对比',
    seoDescription:
      '2026写文章、公众号、长文润色用什么AI大模型？对比 Claude Opus 5.5、Gemini 4 Argon、Kimi K3.1 Pro、DeepSeek V4 Pro、Qwen4 Max 的中文写作表现、文风差异与 API 价格。',
    keywords: ['写文章AI大模型', 'AI写作排行榜', '公众号写作AI推荐', '中文写作大模型对比'],
    intro:
      '写文章和内容创作最怕“AI 味太重”、套话连篇或逻辑前后矛盾。优秀的写作模型不仅需要高综合语言理解能力，还要能按指定语气仿写、稳定驾驭数千字长文结构，并兼顾中文语境的细腻度。',
    selectionTips: [
      '追求最高成文质感与深度专栏分析，优先选 Claude Opus 5.5 / Fable 5.2 或 Gemini 4 Argon。',
      '做中文公众号、商业软文或网文故事，Kimi K3.1 Pro、DeepSeek V4 Pro 与 MiniMax M3.1 的中文语感更自然且国内直连。',
      '批量改写与日常资讯整理，可以用 Qwen4 Max 或 DeepSeek V4.1 Flash 把单篇成本压到几分钱。',
    ],
    relatedPosts: [
      { title: '提示词工程实战指南：如何让 AI 写出高质量文章', href: '/blog/prompt-engineering-guide/' },
      { title: 'GPT vs Claude vs Gemini 全面对比', href: '/blog/gpt-vs-claude-vs-gemini/' },
    ],
    faqs: [
      {
        q: '写中文长文章哪个 AI 大模型最没有“AI 味”？',
        a: '海外模型里 Claude Opus 5.5 和 Gemini 4 Argon 的段落节奏最克制自然；国产模型里 DeepSeek V4 Pro 擅长深度观点论述，Kimi K3.1 Pro 与 MiniMax M3.1 在口语化与故事感上表现出色。',
      },
      {
        q: '用 AI 写文章如何降低胡编事实的风险？',
        a: '建议先提供真实参考资料（利用 1M 长上下文直接喂给模型），并在提示词中要求“只基于给定材料归纳，不确定的数据直接留空”，再配合人工核验关键数据。',
      },
    ],
    evaluate: (m) => {
      const eloNorm = normalizeElo(m.arenaElo);
      const writingBoost =
        ['claude-opus-5-5', 'claude-fable-5-2', 'gemini-4-argon', 'kimi-k3-1-pro', 'deepseek-v4-pro', 'qwen4-max'].includes(
          m.slug,
        )
          ? 6
          : m.slug === 'minimax-m3-1-flash'
            ? 5
            : 0;
      const score = Math.min(99, Math.round(eloNorm * 0.55 + m.reasoningScore * 0.35 + writingBoost));
      const reason =
        m.region === 'china'
          ? `中文表达自然、国内直连无门槛；上下文 ${formatContext(m.contextLength)}，适合长文大纲与深度润色。`
          : `盲测语言质感（Elo ${m.arenaElo}）顶尖，长篇结构严谨，适合高质量专业文章与双语创作。`;
      return { matched: true, score, reason };
    },
  },
  {
    slug: 'ppt',
    name: '做 PPT / 写方案 / 汇报大纲',
    shortName: '做 PPT / 写方案',
    icon: '📊',
    tagline: '结构化提炼强、逻辑清晰、适配演示文稿工作流',
    seoTitle: '2026 做 PPT 与写方案最好用的 AI 大模型排行榜与搭配指南',
    seoDescription:
      '做PPT、写商业计划书和工作汇报用哪个AI大模型最好？对比 GPT-6.2、Gemini 4、Claude 5.5、Qwen4 Max、Kimi K3.1 Pro 的结构化大纲能力与性价比，附 Gamma 搭配建议。',
    keywords: ['做PPT用什么AI', '写方案AI大模型', 'AI生成PPT模型推荐', '办公汇报大模型对比'],
    intro:
      '做 PPT 的核心难点从来不是套模板，而是“把一堆零散资料提炼成逻辑严密的逐页大纲和核心金句”。通用大模型负责理清框架、提炼论据与撰写每页文案，再交给 Gamma 等专业排版工具一键出稿，是目前效率最高的组合。',
    selectionTips: [
      '商业方案、战略汇报和结构化分点，GPT-6.2 Astra / Sol 与 Claude Opus 5.5 的总分结构最稳。',
      '需要直接扔进去几十页 PDF、财报或会议录音再整理成 PPT 大纲，首选 Gemini 4 Carbon 或 Kimi K3.1 Pro。',
      '大纲写好后，可直接复制到 Gamma 一键生成视觉排版，大幅节省调格式时间。',
    ],
    relatedPosts: [
      { title: 'Gamma AI 做 PPT 订阅教程与使用体验', href: '/blog/gamma-subscription-guide/' },
      { title: 'Canva AI 设计工具订阅与实战指南', href: '/blog/canva-subscription-guide/' },
    ],
    faqs: [
      {
        q: '做 PPT 应该直接用大模型，还是用专门的 AI PPT 工具？',
        a: '最佳实践是“两步法”：先用 GPT-6.2、Gemini 4、Kimi K3.1 或 Qwen4 Max 把原始资料整理成逻辑严密的逐页提纲（含标题、要点和图表建议），再导入 Gamma 等专业工具自动排版美化。',
      },
      {
        q: '国内免折腾做汇报方案推荐哪个模型？',
        a: 'Kimi K3.1 Pro 适合直接上传多份中文 PDF/Word 参考资料提炼大纲；Qwen4 Max 和智谱 GLM 5.3 Prime 在国内职场汇报、政企方案措辞上非常顺手。',
      },
    ],
    evaluate: (m) => {
      const ctxBonus = m.contextLength >= 1_000_000 ? 4 : 0;
      const structBonus = ['gpt-6-2-astra', 'gpt-6-2-sol', 'gemini-4-carbon', 'kimi-k3-1-pro', 'qwen4-max', 'glm-5-3-prime'].includes(
        m.slug,
      )
        ? 5
        : 0;
      const score = Math.min(99, Math.round(m.reasoningScore * 0.5 + normalizeElo(m.arenaElo) * 0.4 + ctxBonus + structBonus));
      const reason =
        m.contextLength >= 1_000_000
          ? `支持 ${formatContext(m.contextLength)} 长上下文，可直接吞入整套背景资料提炼逐页 PPT 逻辑大纲。`
          : `逻辑归纳清晰、分点表达利落，适合快速起草商业方案与工作汇报框架。`;
      return { matched: true, score, reason };
    },
  },
  {
    slug: 'coding',
    name: '写代码 / Debug / AI 编程',
    shortName: '写代码 / 编程',
    icon: '💻',
    tagline: '代码工程质量高、跨文件重构稳、IDE 适配好',
    seoTitle: '2026 写代码最好用的 AI 大模型排行榜 — 编程能力与 API 价格对比',
    seoDescription:
      '2026写代码、Debug、配合Cursor和Claude Code用哪个AI大模型？对比 Claude Opus 5.5、Fable 5.2、Sonnet 5.5、Gemini 4 Neon、GPT-6.2 Astra、DeepSeek V4 Pro 编程得分与成本。',
    keywords: ['写代码AI大模型排行', 'AI编程大模型推荐', 'Cursor用什么模型', '编程能力最强LLM'],
    intro:
      '编程场景对模型的指令遵循、多文件上下文记忆和边界条件推理要求极高。选对模型能直接决定 AI 写出的代码是一次跑通，还是越改越乱。',
    selectionTips: [
      '大型代码库重构与疑难 Bug 排查：Claude Opus 5.5 / Fable 5.2 与 Gemini 4 Neon 处于第一梯队。',
      '日常高频 IDE 开发（Cursor / Claude Code）：Claude Sonnet 5.5 和 GPT-6.2 Sol 速度与成本更均衡。',
      '国内直连与高性价比刷算法、写后端接口：DeepSeek V4 Pro 与 Qwen4 Max 成本仅海外旗舰的几分之一。',
    ],
    relatedPosts: [
      { title: 'AI 编程工具横评对比：Cursor / Claude Code / Copilot', href: '/blog/ai-coding-tools-comparison/' },
      { title: 'Claude Code 入门与实战指南', href: '/blog/claude-code-getting-started/' },
      { title: 'Cursor 订阅与使用教程', href: '/blog/cursor-subscription-guide/' },
    ],
    faqs: [
      {
        q: '2026 年编程能力最强的 AI 大模型是哪一款？',
        a: '综合软件工程、代码审查与多步 Agent 编程表现，Claude Fable 5.2、Claude Opus 5.5、GPT-6.2 Astra 和 Gemini 4 Neon 稳居全球第一梯队；国产阵营以 DeepSeek V4 Pro、Qwen4 Max 和 Kimi K3.1 Pro 领先。',
      },
      {
        q: '个人开发者不想花太多 API 费用，写代码怎么选？',
        a: '可以采用分层策略：日常补全与简单脚本用 DeepSeek V4.1 Flash 或 Claude Haiku 5.5，常规功能开发用 DeepSeek V4 Pro / Claude Sonnet 5.5，遇到核心架构或疑难杂症再切到 Opus 5.5。',
      },
    ],
    evaluate: (m) => {
      const score = Math.min(99, Math.round(m.codingScore * 0.7 + m.reasoningScore * 0.2 + normalizeElo(m.arenaElo) * 0.1));
      const matched = m.codingScore >= 88;
      const reason = `编程分 ${m.codingScore} / 推理分 ${m.reasoningScore}，上下文 ${formatContext(m.contextLength)}，${
        m.codingScore >= 95
          ? '适合大型代码库重构与复杂 Agent 编程。'
          : m.region === 'china'
            ? '兼具高编程水准与极低 API 成本，国内直连省心。'
            : '适合日常开发补全、接口编写与自动化代码审查。'
      }`;
      return { matched, score, reason };
    },
  },
  {
    slug: 'long-doc',
    name: '读长文档 / 论文 / 财报总结',
    shortName: '长文档 / 论文财报',
    icon: '📚',
    tagline: '百万 Token 上下文、精准定位细节、输入单价友好',
    seoTitle: '2026 读长文档、论文与财报最好用的 AI 大模型排行榜',
    seoDescription:
      '读几百页PDF论文、年报、合同用什么AI大模型？对比 Gemini 4 Carbon、Kimi K3.1 Pro、DeepSeek V4 Pro、Qwen4 Max、GPT-6.2 的百万上下文窗口与输入成本。',
    keywords: ['长文档AI大模型', '读论文AI推荐', '财报分析大模型', '百万上下文LLM排行'],
    intro:
      '阅读整本行业白皮书、上市公司财报或几十篇学术论文时，不仅要看上下文窗口是否达到 1M（百万 Token，约合数十万汉字），还要看模型在超长输入下的“大海捞针”召回精度以及输入 Token 单价。',
    selectionTips: [
      '中英文混合PDF、图表丰富的年报与带音视频附件的资料，首选 Gemini 4 Carbon（支持原生文件+全模态）。',
      '纯中文长文档、合同审核与研报精读，Kimi K3.1 Pro 输入仅约 $0.24/M，性价比与中文准确度极高。',
      '需要批量对成千上万份文档做摘要归档，DeepSeek V4.1 Flash（输入 $0.03/M）能把成本压到极致。',
    ],
    relatedPosts: [
      { title: '什么是上下文窗口（Context Window）？', href: '/blog/what-is-context-window/' },
      { title: 'NotebookLM 使用指南：AI 论文与资料研究神器', href: '/blog/notebooklm-guide/' },
    ],
    faqs: [
      {
        q: '1M（100 万）上下文窗口大概能放多少汉字？',
        a: '按中文约 1.5–2 Token 对应 1 个汉字估算，1M 上下文大约可容纳 50 万到 65 万字，相当于一次性塞进 2–3 本厚书或整套年度财报。',
      },
      {
        q: '长文档直接塞进上下文，还是搭建 RAG 知识库更好？',
        a: '单次读几份文档直接利用 1M 上下文最省事且全局理解更好；如果文档库达到几百上千份且反复查询，配合 RAG 检索召回会更省 Token 费用。',
      },
    ],
    evaluate: (m) => {
      const has1M = m.contextLength >= 1_000_000;
      const ctxScore = has1M ? 100 : m.contextLength >= 500_000 ? 84 : 70;
      const inCostScore = (m.inputPricePerM ?? 5) <= 0.3 ? 100 : (m.inputPricePerM ?? 5) <= 2 ? 85 : 68;
      const fileBonus = m.modalities.includes('file') ? 4 : 0;
      const score = Math.min(99, Math.round(ctxScore * 0.4 + normalizeElo(m.arenaElo) * 0.35 + inCostScore * 0.2 + fileBonus));
      const reason = `拥有 ${formatContext(m.contextLength)} 上下文，输入价 ${formatPrice(m.inputPricePerM)}/M，${
        m.modalities.includes('file') ? '原生支持文件直传与跨页信息归纳。' : '适合整篇论文、合同与长文本精读。'
      }`;
      return { matched: m.contextLength >= 256_000, score, reason };
    },
  },
  {
    slug: 'reasoning',
    name: '复杂推理 / 数学 / 科研分析',
    shortName: '数学 / 深度推理',
    icon: '🧠',
    tagline: '多步逻辑严密、擅长科研数学与复杂决策推演',
    seoTitle: '2026 数学与深度推理能力最强 AI 大模型排行榜',
    seoDescription:
      '2026推理模型哪个最强？横向对比 Claude Fable 5.2、GPT-6.2 Astra、Gemini 4 Carbon / Neon、DeepSeek V4 Pro、Kimi K3.1 Pro 的深度思考能力与价格。',
    keywords: ['推理AI大模型排行', '数学最强AI模型', '深度思考大模型对比', '科研AI推荐'],
    intro:
      '面对高难数学证明、算法推导、金融建模或复杂因果分析时，普通快思考模型容易跳步出错，需要选择具备强深度推理能力（Reasoning）的旗舰型号。',
    selectionTips: [
      '追求前沿科研、竞赛级数学与多步逻辑绝对上限：Claude Fable 5.2、GPT-6.2 Astra、Gemini 4 Carbon / Neon。',
      '预算敏感但需要强数学与代码推理：DeepSeek V4 Pro 是目前性价比最高的深度推理主力。',
    ],
    relatedPosts: [
      { title: '什么是推理模型（Reasoning Model）？', href: '/blog/what-is-reasoning-model/' },
      { title: '什么是 AI 幻觉？如何减少模型胡说八道', href: '/blog/what-is-ai-hallucination/' },
    ],
    faqs: [
      {
        q: '深度推理模型为什么回复比普通模型慢？',
        a: '推理模型在输出最终答案前会进行多步思维链推演与自我校验，消耗更多推理算力与思考 Token，以此换取复杂问题上的高正确率。',
      },
    ],
    evaluate: (m) => {
      const score = Math.min(99, Math.round(m.reasoningScore * 0.72 + normalizeElo(m.arenaElo) * 0.28));
      return {
        matched: m.reasoningScore >= 90,
        score,
        reason: `推理能力分 ${m.reasoningScore}（综合 Elo ${m.arenaElo}），擅长多步逻辑推演、科学分析与复杂问题拆解。`,
      };
    },
  },
  {
    slug: 'multimodal',
    name: '图片 / 音频 / 视频多模态理解',
    shortName: '音视频 / 多模态',
    icon: '🎬',
    tagline: '原生看图、听音频、分析视频画面与扫描文档',
    seoTitle: '2026 多模态 AI 大模型排行榜 — 看图、听音频、分析视频对比',
    seoDescription:
      '2026支持图片、音频、视频理解的多模态AI大模型怎么选？对比 Gemini 4 全系列、Qwen4 Max、Kimi K3.1 Pro、MiniMax M3.1、字节 Seed 2.1 Turbo 能力与单价。',
    keywords: ['多模态AI大模型排行', '视频理解AI模型', '识图AI推荐', '原生多模态LLM'],
    intro:
      '如果你需要让 AI 识别复杂图表截图、分析一段会议录音，甚至直接看懂长视频里的画面细节，必须挑选具备原生多模态输入能力的模型。',
    selectionTips: [
      '同时需要音频 + 视频 + 图片 + 文档全模态理解：Google Gemini 4 系列（Carbon / Neon / Argon / Hydrogen）覆盖最完整。',
      '国内直连的图文视频理解：Qwen4 Max、Kimi K3.1 Pro、MiniMax M3.1 Flash 与字节 Seed 2.1 Turbo 表现都很成熟。',
    ],
    relatedPosts: [
      { title: '什么是多模态大模型（Multimodal LLM）？', href: '/blog/what-is-multimodal-llm/' },
      { title: '什么是视频理解？AI 如何看懂视频内容', href: '/blog/what-is-video-understanding/' },
    ],
    faqs: [
      {
        q: '所有主流大模型都支持看视频和听音频吗？',
        a: '并不是。目前多数模型支持文本+图像，支持原生视频输入的以 Gemini 4、Qwen4 Max、Kimi K3.1、MiniMax M3.1、Seed 2.1 为代表；同时支持原生音频输入的目前以 Gemini 4 系列最为完善。',
      },
    ],
    evaluate: (m) => {
      const modCount = m.modalities.length;
      const hasVideo = m.modalities.includes('video');
      const hasAudio = m.modalities.includes('audio');
      const hasImage = m.modalities.includes('image');
      const modScore = Math.min(100, 55 + modCount * 9 + (hasVideo ? 6 : 0) + (hasAudio ? 6 : 0));
      const score = Math.min(99, Math.round(modScore * 0.6 + normalizeElo(m.arenaElo) * 0.4));
      return {
        matched: hasImage || hasVideo || hasAudio,
        score,
        reason: `原生支持 ${modCount} 种模态输入，${
          hasAudio && hasVideo
            ? '覆盖文本/图像/音频/视频/文件全场景理解。'
            : hasVideo
              ? '支持图文与视频画面分析，适合多媒体内容整理。'
              : '支持高质量图文与文档页面理解。'
        }`,
      };
    },
  },
  {
    slug: 'cost-effective',
    name: '高性价比 / 批量 API / 省钱主力',
    shortName: '省钱 / 高性价比 API',
    icon: '💰',
    tagline: '单价低至 $0.03/M，适合高并发、RAG 与批量清洗',
    seoTitle: '2026 最便宜高性价比 AI 大模型 API 排行榜与价格对比',
    seoDescription:
      '2026 API 最便宜、性价比最高的 AI 大模型有哪些？按百万 Token 成本对比 DeepSeek V4.1 Flash、Claude Haiku 5.5、MiniMax M3.1 Flash、Seed 2.1 Turbo 与 DeepSeek V4 Pro。',
    keywords: ['最便宜AI大模型API', '高性价比大模型排行', 'LLM API价格对比', '省钱AI模型推荐'],
    intro:
      '把 AI 接入生产系统做客服分流、数据抽取、RAG 问答或批量摘要时，选顶级旗舰往往会导致账单暴涨。高性价比轻量模型能以 1/20 甚至 1/100 的价格完成 85% 以上的常规任务。',
    selectionTips: [
      '追求极致低价批处理：DeepSeek V4.1 Flash（输入 $0.03 / 输出 $0.20）与 Claude Haiku 5.5（$0.10 / $0.50）。',
      '需要兼顾强推理与低成本：DeepSeek V4 Pro 与 Gemini 4 Hydrogen。',
      '配合「模型路由」策略，简单问题走便宜模型、难题升级旗舰，整体 API 账单可省 60%–80%。',
    ],
    relatedPosts: [
      { title: 'AI 订阅与 API 省钱攻略', href: '/blog/ai-subscription-save-money/' },
      { title: '什么是模型路由（Model Routing）？', href: '/blog/what-is-model-routing/' },
    ],
    faqs: [
      {
        q: '便宜的轻量模型和昂贵的旗舰模型在实际使用中差多少？',
        a: '在文本分类、信息抽取、摘要、翻译和常规客服上，轻量模型（如 DeepSeek V4.1 Flash、Claude Haiku 5.5）已经非常接近旗舰，但价格便宜几十倍；主要差距体现在超复杂代码重构与高难数学推理。',
      },
    ],
    evaluate: (m) => {
      const pScore = priceAdvantage(m);
      const score = Math.min(99, Math.round(pScore * 0.62 + normalizeElo(m.arenaElo) * 0.38));
      const matched = (m.blendedPricePerM ?? 99) <= 4;
      const reason = `输入 ${formatPrice(m.inputPricePerM)} / 输出 ${formatPrice(m.outputPricePerM)}（每百万 Token），综合 Elo ${m.arenaElo}，适合大规模低成本调用。`;
      return { matched, score, reason };
    },
  },
  {
    slug: 'china-direct',
    name: '国内直连 / 开源私有化部署',
    shortName: '国内直连 / 国产榜',
    icon: '🇨🇳',
    tagline: '免折腾网络、人民币结算、含开源权重生态',
    seoTitle: '2026 国产 AI 大模型排行榜 — 国内直连好用模型与开源权重对比',
    seoDescription:
      '2026国内直接能用的国产AI大模型排行榜：深度对比 Kimi K3.1 Pro、阿里 Qwen4 Max、DeepSeek V4 Pro / V4.1 Flash、智谱 GLM 5.3 Prime、MiniMax M3.1、字节豆包 Seed 2.1。',
    keywords: ['国产AI大模型排行榜', '国内直连AI推荐', '2026国产大模型对比', '开源大模型排行'],
    intro:
      '对绝大多数国内个人用户与企业团队而言，稳定直连、合规结算与中文场景深度适配是首要刚需。国产大模型在 2026 年已全面进入全球第一梯队，且在 API 成本与开源私有化生态上优势突出。',
    selectionTips: [
      '全能中文长文与多模态：Kimi K3.1 Pro 与阿里 Qwen4 Max。',
      '数学、编程与开源私有化部署：DeepSeek V4 Pro / V4.1 Flash。',
      '企业政企合规与高并发业务：智谱 GLM 5.3 Prime、阿里云百炼（Qwen）与火山引擎（字节 Seed）。',
    ],
    relatedPosts: [
      { title: '开源大模型 vs 闭源大模型怎么选？', href: '/blog/open-source-vs-closed-llm/' },
      { title: 'AI 隐私与企业数据安全使用指南', href: '/blog/ai-privacy-guide/' },
    ],
    faqs: [
      {
        q: '国产大模型里哪些支持开源权重私有化部署？',
        a: '榜单中的 DeepSeek V4 Pro、DeepSeek V4.1 Flash、Kimi K3.1 Pro、MiniMax M3.1 Flash 均具备活跃的开源权重生态，企业可在自有 GPU 集群上部署以满足数据不出内网要求。',
      },
    ],
    evaluate: (m) => {
      const matched = m.region === 'china';
      const openBonus = m.license === 'open-weight' ? 3 : 0;
      const score = Math.min(99, Math.round(normalizeElo(m.arenaElo) * 0.6 + m.reasoningScore * 0.35 + openBonus));
      const reason = `${m.chinaAccess}，综合 Elo ${m.arenaElo}，输入 ${formatPrice(m.inputPricePerM)}/M，中文能力与国内生态适配成熟。`;
      return { matched, score, reason };
    },
  },
];

export function getRankedModelsForScenario(scenario: ScenarioGuide) {
  return allModels
    .map((model) => {
      const result = scenario.evaluate(model);
      return { model, ...result };
    })
    .filter((item) => item.matched)
    .sort((a, b) => b.score - a.score || b.model.arenaElo - a.model.arenaElo);
}

/** 生成传给前端交互选型器的精简矩阵数据（每个场景下各模型的匹配状态、评分与理由） */
export function buildWizardData() {
  return SCENARIOS.map((s) => ({
    slug: s.slug,
    name: s.name,
    shortName: s.shortName,
    icon: s.icon,
    tagline: s.tagline,
    url: `/models/use-case/${s.slug}/`,
    relatedPosts: s.relatedPosts,
    scores: Object.fromEntries(
      allModels.map((m) => {
        const res = s.evaluate(m);
        return [m.slug, res];
      }),
    ),
  }));
}
