/**
 * Server-side Portfolio Knowledge Retrieval & Response Engine.
 *
 * Grounded in Naïm Bsili's verified portfolio projects, case studies,
 * design systems, AI/automation workflows, and career profile.
 */

// Comprehensive portfolio knowledge dataset
export const PORTFOLIO_KNOWLEDGE = {
  profile: {
    name: 'Naïm Bsili',
    role: 'Senior Product Designer · AI Workflow Builder · Automation Architect',
    bio: 'Product designer and builder with over 8 years of experience combining UX/UI, Enterprise Design Systems, AI-driven automation (n8n, Gemini, RAG, MCP), and Low-Code development (OutSystems, Mendix).',
    location: 'Tunis / Remote',
    url: 'https://naiimbsili.com',
  },

  skills: [
    {
      category: 'Product Design & UX/UI',
      highlights: [
        'End-to-end Product Design from concept to production-ready UI in Figma',
        'Complex user workflow mapping, wireframing, and interactive prototyping',
        'Design systems creation, tokenization, component architecture, and accessibility (WCAG)',
        'Responsive mobile and desktop web design with visual hierarchy and rhythm',
      ],
      evidence: ['WINNI', 'Assestini', 'Cha9a9a', 'Saudi Government Services', 'DGA Experience'],
    },
    {
      category: 'Problem Framing & Methodology',
      highlights: [
        'Structured 4-stage delivery process: Frame → Structure → Design → Build',
        'Deconstructing ambiguous stakeholder requirements into clear operational logic',
        'Translating complex System Requirements Specifications (SRS) and use cases into intuitive interfaces',
        'Focus on business viability, technical feasibility, and real user adoption',
      ],
      evidence: ['All portfolio case studies', 'Saudi Banking', 'Assestini'],
    },
    {
      category: 'AI Agents & Automation Engineering',
      highlights: [
        'n8n workflow orchestration, webhook triggers, API integrations, and error handling',
        'Autonomous AI agents with tool use, memory, and RAG (Retrieval-Augmented Generation)',
        'Model integration with Google Gemini, Claude, and OpenAI',
        'Model Context Protocol (MCP) integrations connecting AI agents to backend services',
        'Telegram bot interfaces for voice transcription and conversational queries',
      ],
      evidence: ['Naïm Copilot', 'Career OS', 'Assestini Control Center'],
    },
    {
      category: 'Low-Code & Front-End Engineering',
      highlights: [
        'Enterprise Low-Code UI development with OutSystems and Mendix',
        'Building and maintaining enterprise design systems for low-code environments (OutSystems UI)',
        'Semantic HTML5, CSS3, modern Bootstrap, and JavaScript front-end integration',
        'React, Vite, Supabase, and full-stack prototyping',
      ],
      evidence: ['DGA Experience', 'Saudi Banking', 'Saudi Regulatory', 'Cha9a9a'],
    },
  ],

  projects: [
    {
      id: 'winni',
      slug: 'winni',
      title: 'WINNI',
      kicker: 'PRODUCT · QR · LOST & FOUND',
      year: 2026,
      category: 'Product Design',
      roles: ['Product Designer', 'UX/UI', 'AI'],
      tools: ['Figma', 'React', 'QR/NFC'],
      route: '/work/winni',
      summary:
        'A physical-digital recovery experience for personal belongings (cars, luggage, motorcycles) designed around one core principle: the finder should never have to create an account or become a user to return an item.',
      details:
        'Features an anonymous finder interaction flow, private owner notifications, optional location sharing ("Share where you found it"), and sticker lifecycle tracking.',
    },
    {
      id: 'assestini',
      slug: 'assestini',
      title: 'Assestini',
      kicker: 'PRODUCT · OPERATIONAL INTELLIGENCE',
      year: 2026,
      category: 'Product Design',
      roles: ['Product Designer', 'AI', 'RAG'],
      tools: ['Figma', 'React', 'TypeScript', 'Supabase', 'Google Gemini', 'RAG'],
      route: '/work/assestini',
      summary:
        'An operational intelligence layer connecting project estimation, delivery tracking, profit margins, cash flow, and AI-assisted operational decisions.',
      details:
        'Embeds Google Gemini and RAG as structural product capabilities rather than a superficial chatbot, transforming unstructured scopes into actionable financial forecasts.',
    },
    {
      id: 'cha9a9a',
      slug: 'cha9a9a',
      title: 'Cha9a9a',
      kicker: 'WEB · FIGMA → CODE',
      year: 2026,
      category: 'Front-End Integration',
      roles: ['UI Developer', 'Front-End Integrator'],
      tools: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'Figma'],
      route: '/work/cha9a9a',
      summary:
        'Translating approved Figma mockups into a responsive, accessible HTML5/CSS/Bootstrap/JavaScript web experience for a community platform concept.',
      details:
        'Maintains strict visual fidelity, modular component structure, and responsive layout across viewport sizes.',
    },
    {
      id: 'naim-copilot',
      slug: 'naim-copilot',
      title: 'Naïm Copilot',
      kicker: 'AI SYSTEM · N8N · PERSONAL OPERATING LAYER',
      year: 2026,
      category: 'AI Agent',
      roles: ['AI Product Designer', 'AI Builder', 'Automation Architect'],
      tools: ['n8n', 'Google Gemini', 'PostgreSQL', 'Telegram', 'AI Agents', 'RAG', 'MCP'],
      route: '/work/naim-copilot',
      summary:
        'A personal AI agent that connects memory, portfolio knowledge, active projects, and actions into a unified conversational interface accessible via Telegram and Web.',
      details:
        'Built with an n8n workflow core, PostgreSQL vector memory, Google Gemini reasoning, and MCP gateway integration. Handles text and voice transcription input.',
    },
    {
      id: 'career-os',
      slug: 'career-os',
      title: 'Career OS · Daily Job Search',
      kicker: 'AI AUTOMATION · JOB SEARCH · SCORING',
      year: 2026,
      category: 'AI Automation',
      roles: ['Product Designer', 'AI Workflow Builder'],
      tools: ['n8n', 'Google Gemini', 'Claude', 'Job APIs', 'PostgreSQL', 'Telegram', 'Email'],
      route: '/work/career-os',
      summary:
        'An automated career pipeline that aggregates opportunities across remote platforms, eliminates duplicates, evaluates skill fit using AI, and delivers a curated daily digest.',
      details:
        'Never applies automatically; acts as a focused decision filter saving hours of manual job browsing.',
    },
    {
      id: 'saudi-government',
      slug: 'saudi-government',
      title: 'Saudi · Government Digital Services',
      kicker: 'SAUDI ARABIA · GOVERNMENT SECTOR',
      year: 2025,
      category: 'Digital Services',
      roles: ['Senior UX/UI Designer', 'UI Developer'],
      tools: ['OutSystems', 'Figma', 'Design Systems', 'Responsive UI'],
      route: '/work/saudi-government',
      summary:
        'UX/UI design and OutSystems low-code interface delivery for Saudi digital government environments through ENVNT / Wevioo.',
      details:
        'Focused on translating complex multi-stakeholder government workflows into accessible, consistent, and production-ready digital screens. Client project names are intentionally omitted from public documentation in adherence to non-disclosure agreements.',
    },
    {
      id: 'saudi-banking',
      slug: 'saudi-banking',
      title: 'Saudi · Banking & Financial Services',
      kicker: 'SAUDI ARABIA · BANKING SECTOR',
      year: 2025,
      category: 'Financial Services',
      roles: ['Senior UX Designer', 'Mendix UI Developer'],
      tools: ['Mendix', 'Figma', 'UX/UI', 'SRS', 'Low-Code', 'Design Systems'],
      route: '/work/saudi-banking',
      summary:
        'UX/UI design and Mendix interface implementation in a Saudi banking and financial services environment through ENVNT / Wevioo.',
      details:
        'Translated System Requirements Specifications (SRS), complex use cases, and regulated banking workflows into clear Figma design systems and production-ready Mendix components. Confidential client and project names are intentionally omitted.',
    },
    {
      id: 'dga',
      slug: 'dga',
      title: 'DGA Experience · Digital Government Experience',
      kicker: 'SAUDI ARABIA · GOVERNMENT DESIGN SYSTEM',
      year: 2025,
      category: 'Design Systems',
      roles: ['Design Systems Lead', 'UI Designer', 'Design System Contributor'],
      tools: ['OutSystems', 'Figma', 'Design Systems', 'Government Digital Services'],
      route: '/work/dga',
      summary:
        'Contribution to digital government UX/UI and design-system standards in Saudi Arabia delivered through ENVNT / Wevioo.',
      details:
        'Created reusable design-system patterns, accessible UI standards, and translated visual specifications into OutSystems UI components for government portals.',
    },
    {
      id: 'saudi-regulatory',
      slug: 'saudi-regulatory',
      title: 'Saudi · Regulatory / Healthcare Digital Services',
      kicker: 'SAUDI ARABIA · REGULATORY / HEALTHCARE',
      year: 2025,
      category: 'Regulated Services',
      roles: ['Senior UX/UI Designer', 'OutSystems UI Developer'],
      tools: ['OutSystems', 'Figma', 'UX/UI', 'Responsive Design', 'Design Systems'],
      route: '/work/saudi-regulatory',
      summary:
        'UX/UI and OutSystems interface implementation for regulated digital services in Saudi Arabia through ENVNT / Wevioo.',
      details:
        'Designed service interfaces and responsive UI patterns for complex compliance and regulated workflows. Presented publicly by sector rather than client project name.',
    },
  ],

  methodology: {
    framework: 'Frame → Structure → Design → Build',
    steps: [
      {
        number: '01',
        title: 'Frame',
        description: 'Clarify the core problem, user needs, operational constraints, and business goals before creating visual mockups.',
      },
      {
        number: '02',
        title: 'Structure',
        description: 'Translate ambiguous requirements, SRS, and use cases into clear user flows, information architecture, and product logic.',
      },
      {
        number: '03',
        title: 'Design',
        description: 'Create high-fidelity, reusable, and implementation-ready UI in Figma with systematic design tokens and responsive patterns.',
      },
      {
        number: '04',
        title: 'Build',
        description: 'Connect design directly to technology (OutSystems, Mendix, React, n8n) and iterate based on real feedback in the browser.',
      },
    ],
    designSystemsPhilosophy:
      'A design system is not just a UI kit—it is a shared contract between product, design, and engineering. Components must be tokenized, accessible, and directly mappable to production low-code widgets (OutSystems UI, Mendix) or web components.',
  },

  privacyPolicy: {
    rule: 'Confidentiality & Public Portfolio Disclosures',
    note: 'In accordance with non-disclosure agreements and client privacy, specific enterprise client and government project names for Saudi Arabia work (delivered through ENVNT / Wevioo) are intentionally omitted from the public portfolio. Case studies are presented by sector (Government, Banking, Regulatory) focusing on UX/UI, design systems, and architecture.',
  },
};

/**
 * Evaluates user query and returns grounded portfolio knowledge.
 */
export async function queryPortfolioKnowledge({ input = '', tool = 'query_knowledge_base', slug = 'naim-copilot' }) {
  const query = (input || '').trim().toLowerCase();

  if (!query) {
    return {
      matched: false,
      answer: "I couldn't find enough information in my portfolio knowledge base to answer that confidently.",
    };
  }

  // 1. SKILLS & PRODUCT DESIGN QUESTIONS
  const isSkillsQuery =
    query.includes('skill') ||
    query.includes('strength') ||
    query.includes('strongest') ||
    query.includes('what can naim do') ||
    (query.includes('design') && (query.includes('product') || query.includes('ux') || query.includes('ui')));

  if (isSkillsQuery && !query.includes('saudi') && !query.includes('framing') && !query.includes('workflow')) {
    const answer = [
      "Naïm's strongest product design skills center on combining end-to-end product thinking, enterprise design systems, and hands-on technical execution:\n",
      "• **Product Design & UX/UI**: Translating complex operational problems into clear, usable interfaces in Figma. Experienced in end-to-end product scoping, interaction design, and responsive systems (demonstrated in [WINNI](/work/winni) and [Assestini](/work/assestini)).",
      "• **Enterprise Design Systems**: Architecting scalable, accessible component libraries and design tokens. Extensive experience aligning Figma systems with production platforms like OutSystems UI and Mendix (demonstrated in the [DGA Experience](/work/dga)).",
      "• **Problem Framing (Frame → Structure → Design → Build)**: Moving from ambiguous business requirements and SRS documents to structured user flows and implementation-ready architectures.",
      "• **AI & Automation Systems**: Designing autonomous agent workflows, RAG systems, and tool integrations using n8n, Google Gemini, PostgreSQL vector memory, and MCP (demonstrated in [Naïm Copilot](/work/naim-copilot) and [Career OS](/work/career-os)).",
      "• **Low-Code & Front-End Implementation**: Bridging design with code through OutSystems, Mendix, React, and semantic HTML/CSS/JavaScript (demonstrated in [Cha9a9a](/work/cha9a9a)).",
    ].join('\n\n');

    return { matched: true, answer, topic: 'skills' };
  }

  // 2. SAUDI GOVERNMENT & BANKING WORK QUESTIONS
  const isSaudiQuery =
    query.includes('saudi') ||
    query.includes('banking') ||
    query.includes('government') ||
    query.includes('dga') ||
    query.includes('regulatory') ||
    query.includes('envnt') ||
    query.includes('wevioo');

  if (isSaudiQuery) {
    const answer = [
      "Naïm delivered extensive UX/UI and low-code product design work in Saudi Arabia through ENVNT / Wevioo across digital government, banking, and regulatory sectors:\n",
      "• **[Saudi · Government Digital Services](/work/saudi-government)**: Senior UX/UI Designer & UI Developer. Designed accessible digital government service flows, responsive screens, and reusable UI components implemented in OutSystems.",
      "• **[Saudi · Banking & Financial Services](/work/saudi-banking)**: UX Designer & Mendix UI Developer. Translated System Requirements Specifications (SRS), multi-step banking use cases, and regulated transaction flows into Figma prototypes and low-code Mendix components.",
      "• **[DGA · Digital Government Experience](/work/dga)**: Design Systems Contributor & UI Designer. Contributed to unified digital government design-system patterns, accessibility standards, and OutSystems UI implementations.",
      "• **[Saudi · Regulatory / Healthcare](/work/saudi-regulatory)**: UX/UI Designer. Structured regulated service workflows and created responsive interface patterns for low-code execution.",
      "\n*Privacy & Confidentiality Note: In accordance with non-disclosure agreements, specific client project names are intentionally omitted from public case studies; work is presented publicly by industry sector.*",
    ].join('\n\n');

    return { matched: true, answer, topic: 'saudi_work' };
  }

  // 3. AI & N8N AUTOMATION PROJECTS QUESTIONS
  const isAiAutomationQuery =
    query.includes('ai') ||
    query.includes('n8n') ||
    query.includes('automation') ||
    query.includes('agent') ||
    query.includes('rag') ||
    query.includes('mcp') ||
    query.includes('gemini') ||
    query.includes('copilot') ||
    query.includes('career os');

  if (isAiAutomationQuery && !query.includes('framing')) {
    const answer = [
      "Naïm has built several production AI systems, autonomous agents, and automation workflows:\n",
      "• **[Naïm Copilot](/work/naim-copilot)**: A personal AI agent built with n8n, Google Gemini, PostgreSQL vector memory, and Telegram. It handles voice/text input, retrieves knowledge via RAG, queries active projects, and executes actions through MCP.",
      "• **[Career OS · Daily Job Search](/work/career-os)**: An automated career intelligence pipeline built with n8n, Google Gemini, Claude, and PostgreSQL. It crawls remote job APIs, deduplicates postings, scores fit against career profiles using AI, and delivers curated Telegram and email digests.",
      "• **[Assestini](/work/assestini)**: An operational intelligence platform that integrates Google Gemini and RAG into project scoping, estimating profit margins, delivery tracking, and cash-flow forecasting.",
      "• **[WINNI](/work/winni)**: A physical + digital identity product where QR/NFC objects connect finders with owners privately, supported by automated notification pipelines.",
    ].join('\n\n');

    return { matched: true, answer, topic: 'ai_automation' };
  }

  // 4. PROBLEM FRAMING & DESIGN SYSTEMS QUESTIONS
  const isMethodologyQuery =
    query.includes('framing') ||
    query.includes('approach') ||
    query.includes('methodology') ||
    query.includes('process') ||
    query.includes('design system') ||
    query.includes('design systems');

  if (isMethodologyQuery) {
    const answer = [
      "Naïm approaches problem framing and design systems with a structured, implementation-focused philosophy:\n",
      "### Problem Framing: The 4-Stage Process\n",
      "1. **Frame**: Clarify the core problem, user constraints, operational bottlenecks, and business outcomes before designing visual screens. Reject vague assumptions early.",
      "2. **Structure**: Translate complex requirements and SRS into explicit user flows, state machines, and information architecture.",
      "3. **Design**: Build clear, accessible, and implementation-ready UI in Figma with rigorous component hierarchy and responsive layout.",
      "4. **Build**: Connect design directly to engineering—whether via low-code platforms (OutSystems, Mendix) or web stacks (React, Vite, n8n)—validating in the browser and iterating on real evidence.",
      "\n### Design Systems Approach\n",
      "Naïm views design systems as operational infrastructure rather than static style guides. In projects like the **[DGA Experience](/work/dga)** and Saudi Government services, he focused on:\n",
      "• Tokenized components that map directly between Figma and production low-code widgets (OutSystems UI / Mendix).",
      "• Strict accessibility standards and bilingual (English & Arabic/RTL) responsiveness.",
      "• Governed component libraries that allow delivery teams to ship features quickly without breaking visual consistency.",
    ].join('\n\n');

    return { matched: true, answer, topic: 'methodology' };
  }

  // 5. SPECIFIC PROJECT LOOKUPS
  const matchedProject = PORTFOLIO_KNOWLEDGE.projects.find(
    (p) => query.includes(p.slug) || query.includes(p.title.toLowerCase())
  );

  if (matchedProject) {
    const answer = [
      `**[${matchedProject.title}](${matchedProject.route})** (${matchedProject.year}) — *${matchedProject.kicker}*\n`,
      `• **Overview**: ${matchedProject.summary}`,
      `• **Details**: ${matchedProject.details}`,
      `• **Role**: ${matchedProject.roles.join(', ')}`,
      `• **Tech Stack**: ${matchedProject.tools.join(', ')}`,
      `\nYou can view the full case study at [${matchedProject.title}](${matchedProject.route}).`,
    ].join('\n\n');

    return { matched: true, answer, topic: `project_${matchedProject.slug}` };
  }

  // 6. GENERAL REPOSITORY / PROFILE SUMMARY
  if (query.includes('naim') || query.includes('who is') || query.includes('about') || query.includes('experience')) {
    const answer = [
      `**Naïm Bsili** is a ${PORTFOLIO_KNOWLEDGE.profile.role} with over 8 years of experience building digital products across the MENA region.\n`,
      'His work spans:',
      '• **Product Design & UX/UI**: [WINNI](/work/winni), [Assestini](/work/assestini), [Cha9a9a](/work/cha9a9a)',
      '• **Saudi Enterprise Digital Services**: [Saudi Government](/work/saudi-government), [Saudi Banking](/work/saudi-banking), [DGA Design System](/work/dga)',
      '• **AI Agents & Workflows**: [Naïm Copilot](/work/naim-copilot), [Career OS](/work/career-os)',
      '\nFeel free to ask about his specific design skills, methodology, Saudi work, or AI automation projects.',
    ].join('\n\n');

    return { matched: true, answer, topic: 'profile' };
  }

  // 7. NO SUFFICIENT KNOWLEDGE MATCH (Safe fallback answer required by spec)
  return {
    matched: false,
    answer: "I couldn't find enough information in my portfolio knowledge base to answer that confidently.",
  };
}
