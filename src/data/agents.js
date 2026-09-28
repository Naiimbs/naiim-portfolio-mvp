import copilotCoverImg from '../assets/images/cover-copilot-naim.png';
import copilotEvidenceImg from '../assets/images/The-work-behind-the-interface.png';
import dailyJobsearchCoverImg from '../assets/images/daily-jobsearch-os-cover.png';

/**
 * Local verified AI Agents dataset (Safety net / Fallback layer).
 * Used when Supabase is unavailable or offline.
 */
export const agents = [
  {
    id: 'naim-copilot',
    slug: 'naim-copilot',
    name: 'Naïm Copilot',
    short_description: 'A personal AI agent that connects memory, knowledge, projects and actions so work can be queried and updated through conversational interfaces.',
    description: 'A personal AI agent built with n8n, PostgreSQL and Google Gemini. It handles Telegram text/voice queries, retrieves knowledge via RAG and executes actions across project tools.',
    category: 'Conversational Agent',
    status: 'published',
    year: 2026,
    role: 'AI Product Designer · Automation Architect',
    tools: ['n8n', 'Google Gemini', 'PostgreSQL', 'Telegram', 'RAG', 'MCP'],
    workflow_platform: 'n8n',
    thumbnail: copilotCoverImg,
    hero_image: copilotCoverImg,
    demo_type: 'internal',
    demo_url: '/copilot',
    github_url: 'https://github.com/naiimbsili',
    n8n_workflow_url: null,
    is_featured: true,
    sort_order: 1,
    seo_title: 'Naïm Copilot — Personal AI System & Workflow Automation',
    seo_description: 'A personal AI agent that connects memory, knowledge, projects and actions through a single conversational interface.',
    canonical_path: '/agents/naim-copilot',
    sections: [
      {
        id: 'sec-copilot-hero',
        section_type: 'hero',
        title: 'Naïm Copilot',
        eyebrow: 'AI SYSTEM · N8N · PERSONAL OPERATING LAYER',
        order_index: 1,
        is_visible: true,
        blocks: [
          {
            id: 'blk-copilot-hero-text',
            block_type: 'text',
            content: {
              heading: 'Naïm Copilot',
              body: 'A personal AI agent that connects memory, knowledge, projects and actions so work can be queried and updated through a single conversational interface.',
              metaChips: [
                'Personal AI system',
                'AI Product Designer · AI Builder · Automation Architect',
                'n8n · PostgreSQL · Gemini',
              ],
            },
            order_index: 1,
            is_visible: true,
          },
          {
            id: 'blk-copilot-hero-img',
            block_type: 'image',
            content: {
              media_url: copilotCoverImg,
              alt: 'Naïm Copilot n8n workflow diagram showing Telegram, AI Agent, memory and project tools',
              caption: 'Naïm Copilot architecture diagram and orchestration layer.',
            },
            order_index: 2,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-copilot-problem',
        section_type: 'challenge',
        title: 'The Challenge & Need for Memory',
        eyebrow: 'THE PROBLEM',
        order_index: 2,
        is_visible: true,
        blocks: [
          {
            id: 'blk-copilot-problem-text',
            block_type: 'text',
            content: {
              heading: 'Moving Beyond Ephemeral Chatbots',
              body: 'Generic chatbots lack long-term memory, context of ongoing projects, and the ability to trigger backend operations. How can one unified agent understand professional history, remember decisions, search documentation, and take action reliably?',
              role: 'AI Product Designer · AI Builder · Automation Architect',
              context: 'Personal AI Operating System',
            },
            order_index: 1,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-copilot-workflow',
        section_type: 'workflow',
        title: 'System Architecture & Decision Flow',
        eyebrow: 'HOW IT WORKS',
        order_index: 3,
        is_visible: true,
        blocks: [
          {
            id: 'blk-copilot-wf',
            block_type: 'workflow',
            content: {
              nodes: [
                { type: 'Trigger', title: 'Telegram Input', description: 'Voice message or text query received via webhook.' },
                { type: 'AI Agent', title: 'Reasoning Engine', description: 'Google Gemini analyzes intent and formulates tool execution plan.' },
                { type: 'Memory', title: 'PostgreSQL Context', description: 'Retrieves conversational history and user preference vectors.' },
                { type: 'Action', title: 'Tool Execution', description: 'Searches projects, creates tasks, or formats structured responses.' },
                { type: 'Response', title: 'Telegram Dispatch', description: 'Formatted markdown or audio message returned to user.' },
              ],
            },
            order_index: 1,
            is_visible: true,
          },
          {
            id: 'blk-copilot-contrib',
            block_type: 'process',
            content: {
              steps: [
                { number: '01', title: 'Frame', desc: 'Clarify conversational operating model around memory, knowledge and project state.' },
                { number: '02', title: 'Structure', desc: 'Connect PostgreSQL chat memory and structured vector RAG search.' },
                { number: '03', title: 'Integrate', desc: 'Build n8n workflow supporting Telegram voice transcription and tool calling.' },
                { number: '04', title: 'Validate', desc: 'Refine prompts, guardrails, error fallbacks and response latency.' },
              ],
            },
            order_index: 2,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-copilot-demo',
        section_type: 'demo',
        title: 'Interactive Copilot Experience',
        eyebrow: 'TRY THE AGENT',
        order_index: 4,
        is_visible: true,
        blocks: [
          {
            id: 'blk-copilot-demoblock',
            block_type: 'demo',
            content: {
              demo_type: 'internal',
              demo_url: '/copilot',
              label: 'Open Naïm Copilot Widget',
              description: 'Try asking about Naïm’s projects, UX/UI background, tools, and experience.',
            },
            order_index: 1,
            is_visible: true,
          },
          {
            id: 'blk-copilot-evidence-img',
            block_type: 'image',
            content: {
              media_url: copilotEvidenceImg,
              alt: 'The work behind the interface — n8n orchestration details',
              caption: 'The orchestration nodes powering Naïm Copilot logic and routing.',
            },
            order_index: 2,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-copilot-tools',
        section_type: 'technology',
        title: 'Tools & Integrations',
        eyebrow: 'TECHNOLOGY',
        order_index: 5,
        is_visible: true,
        blocks: [
          {
            id: 'blk-copilot-tech',
            block_type: 'tech_stack',
            content: {
              items: [
                { name: 'n8n', category: 'Workflow Automation' },
                { name: 'Google Gemini', category: 'LLM Reasoning' },
                { name: 'PostgreSQL', category: 'Memory & Vector Database' },
                { name: 'Telegram Bot API', category: 'Conversational Client' },
                { name: 'RAG', category: 'Knowledge Retrieval' },
                { name: 'MCP', category: 'Context Protocol' },
              ],
            },
            order_index: 1,
            is_visible: true,
          },
        ],
      },
    ],
  },
  {
    id: 'career-os',
    slug: 'career-os',
    name: 'Career OS · Job Search Agent',
    short_description: 'An automated workflow agent that aggregates job opportunities, eliminates duplicates, scores fit using AI, and delivers a curated daily digest.',
    description: 'An intelligent pipeline designed to remove the repetitive chore of manual career searching. Built with n8n and Google Gemini, it crawls APIs, evaluates profile match, and notifies via Telegram and email.',
    category: 'Automation & Scoring Agent',
    status: 'published',
    year: 2026,
    role: 'Product Designer · AI Workflow Builder',
    tools: ['n8n', 'Google Gemini', 'PostgreSQL', 'Job APIs', 'Telegram', 'Email'],
    workflow_platform: 'n8n',
    thumbnail: dailyJobsearchCoverImg,
    hero_image: dailyJobsearchCoverImg,
    demo_type: 'none',
    demo_url: null,
    github_url: 'https://github.com/naiimbsili',
    n8n_workflow_url: null,
    is_featured: true,
    sort_order: 2,
    seo_title: 'Career OS · Daily Job Search Agent — Naïm Bsili',
    seo_description: 'An automated career search workflow that collects opportunities, removes duplicates, scores fit and delivers a daily digest.',
    canonical_path: '/agents/career-os',
    sections: [
      {
        id: 'sec-career-hero',
        section_type: 'hero',
        title: 'Career OS · Daily Job Search',
        eyebrow: 'AI AUTOMATION · JOB SEARCH · SCORING',
        order_index: 1,
        is_visible: true,
        blocks: [
          {
            id: 'blk-career-hero-text',
            block_type: 'text',
            content: {
              heading: 'Career OS · Daily Job Search',
              body: 'An automated career-search workflow that collects opportunities, removes duplicates, scores fit and sends a focused daily digest.',
              metaChips: [
                'Personal automation system',
                'Product Designer · AI Workflow Builder',
                'n8n · Gemini · PostgreSQL',
              ],
            },
            order_index: 1,
            is_visible: true,
          },
          {
            id: 'blk-career-hero-img',
            block_type: 'image',
            content: {
              media_url: dailyJobsearchCoverImg,
              alt: 'Career OS n8n workflow diagram showing job sources, deduplication, AI fit scoring and digest',
              caption: 'Automated ingestion, deduplication, and scoring pipeline.',
            },
            order_index: 2,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-career-problem',
        section_type: 'challenge',
        title: 'The Challenge',
        eyebrow: 'THE CHALLENGE',
        order_index: 2,
        is_visible: true,
        blocks: [
          {
            id: 'blk-career-problem-text',
            block_type: 'text',
            content: {
              heading: 'Filtering Noise in High-Volume Searches',
              body: 'How can repetitive job searching become a consistent pipeline where relevant roles are collected, evaluated, and prioritized automatically rather than checking dozens of boards manually every day?',
              role: 'Product Designer · AI Workflow Builder',
              context: 'Personal Automation System',
            },
            order_index: 1,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-career-workflow',
        section_type: 'workflow',
        title: 'Data Flow & Intelligent Scoring',
        eyebrow: 'HOW IT WORKS',
        order_index: 3,
        is_visible: true,
        blocks: [
          {
            id: 'blk-career-wf',
            block_type: 'workflow',
            content: {
              nodes: [
                { type: 'Trigger', title: 'Scheduled Cron', description: 'Triggers daily ingestion cycle at scheduled intervals.' },
                { type: 'Action', title: 'Multi-Source Fetch', description: 'Pulls listings from remote job boards and RSS feeds.' },
                { type: 'Decision', title: 'Deduplication', description: 'Filters out previously processed job URLs via PostgreSQL check.' },
                { type: 'AI Agent', title: 'Fit Evaluation', description: 'Gemini analyzes job criteria against target skill profile.' },
                { type: 'Response', title: 'Digest Notification', description: 'Sends prioritized Telegram & Email digest with top matches.' },
              ],
            },
            order_index: 1,
            is_visible: true,
          },
        ],
      },
      {
        id: 'sec-career-tools',
        section_type: 'technology',
        title: 'Technology Stack',
        eyebrow: 'TECHNOLOGY',
        order_index: 4,
        is_visible: true,
        blocks: [
          {
            id: 'blk-career-tech',
            block_type: 'tech_stack',
            content: {
              items: [
                { name: 'n8n', category: 'Workflow Automation' },
                { name: 'Google Gemini', category: 'AI Scoring' },
                { name: 'PostgreSQL', category: 'Deduplication Store' },
                { name: 'Telegram Bot API', category: 'Digest Alerts' },
                { name: 'Job APIs', category: 'Data Ingestion' },
                { name: 'Email SMTP', category: 'Summary Reports' },
              ],
            },
            order_index: 1,
            is_visible: true,
          },
        ],
      },
    ],
  },
];
