import dailyJobsearchCoverImg from '../assets/images/daily-jobsearch-os-cover.png';
import cha9a9aReferenceImg from '../assets/images/cha9a9a-homepage-reference.png';
import copilotCoverImg from '../assets/images/cover-copilot-naim.png';
import copilotEvidenceImg from '../assets/images/The-work-behind-the-interface.png';
import dgaGovHeroImg from '../assets/images/dga_government_services_case_hero_skeleton.png';
import dgaGovEvidenceImg from '../assets/images/dga_government_services_case_evidence_skeleton.png';
import dgaBankingHeroImg from '../assets/images/dga_antifraud_case_hero_skeleton_v2.png';
import dgaBankingEvidenceImg from '../assets/images/dga_antifraud_case_evidence_skeleton_v2.png';
import dgaDigitalHeroImg from '../assets/images/dga_digital_government_case_hero_skeleton.png';
import dgaDigitalEvidenceImg from '../assets/images/dga_digital_government_case_evidence_skeleton.png';
import dgaRegHeroImg from '../assets/images/dga_regulatory_healthcare_case_hero_skeleton.png';
import dgaRegEvidenceImg from '../assets/images/dga_regulatory_healthcare_case_evidence_skeleton.png';

export const caseStudies = {
  winni: {
    slug: 'winni',
    type: 'custom',
    title: 'WINNI',
    subtitle: 'Giving lost things a way back.',
  },
  assestini: {
    slug: 'assestini',
    type: 'custom',
    title: 'Assestini',
    subtitle: 'Operational Intelligence Platform',
  },
  cha9a9a: {
    slug: 'cha9a9a',
    type: 'standard',
    hero: {
      eyebrow: 'WEB DESIGN → FRONT-END INTEGRATION',
      title: 'Cha9a9a',
      lead: 'Turning a Figma interface into a responsive HTML/CSS/Bootstrap/JavaScript experience for a community platform.',
      metaChips: [
        'Cha9a9a.tn / web under construction',
        'UI Developer · Front-End Integrator',
      ],
      image: cha9a9aReferenceImg,
      imageAlt: 'Cha9a9a homepage reference screenshot supplied by Naïm',
      caption: 'Selected project evidence.',
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'Translate a visual concept into a responsive, usable web experience.',
      copy: 'Cha9a9a is a community-oriented platform concept. My role focused on taking the approved Figma direction and translating it into a responsive front-end experience while preserving the visual hierarchy, cards, calls to action and content rhythm.',
      role: 'UI Developer · Front-End Integrator',
      context: 'Cha9a9a.tn · website currently under construction',
    },
    contribution: {
      eyebrow: 'MY CONTRIBUTION',
      title: 'From Figma handoff to implementation.',
      items: [
        'Integrated the approved Figma mockups into semantic HTML.',
        'Built responsive layouts with CSS and Bootstrap.',
        'Implemented interactive behaviors with JavaScript.',
        'Translated cards, navigation, hero sections, categories and FAQ patterns into reusable UI structures.',
        'Focused on visual fidelity between design and browser output.',
        'Prepared the implementation so content and imagery can evolve without rebuilding the interface.',
      ],
      process: [
        { step: '01', title: 'Read', desc: 'Understand the Figma structure, components, spacing and hierarchy.' },
        { step: '02', title: 'Translate', desc: 'Convert visual decisions into semantic HTML and Bootstrap layout.' },
        { step: '03', title: 'Refine', desc: 'Tune CSS, typography, spacing and responsive behavior.' },
        { step: '04', title: 'Validate', desc: 'Compare browser output with the intended design and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'DESIGN → CODE',
      title: 'A snapshot of the interface I translated into front-end.',
      image: cha9a9aReferenceImg,
      imageAlt: 'Cha9a9a.tn homepage screenshot showing the Figma-to-HTML implementation target',
      caption: 'Cha9a9a.tn — provided homepage reference showing the visual system, content structure and responsive UI target.',
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Tools and technologies',
      tags: ['Figma', 'HTML', 'CSS', 'Bootstrap', 'JavaScript', 'Responsive UI'],
    },
  },
  'naim-copilot': {
    slug: 'naim-copilot',
    type: 'standard',
    hero: {
      eyebrow: 'AI SYSTEM · N8N · PERSONAL OPERATING LAYER',
      title: 'Naïm Copilot',
      lead: 'A personal AI agent that connects memory, knowledge, projects and actions so work can be queried and updated through a single conversational interface.',
      metaChips: [
        'Personal AI system',
        'AI Product Designer · AI Builder · Automation Architect',
      ],
      image: copilotCoverImg,
      imageAlt: 'Naïm Copilot n8n workflow screenshot showing Telegram, AI Agent, memory and project tools',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can one assistant understand my professional context, remember decisions, search projects and trigger actions instead of behaving like a generic chatbot?',
      role: 'AI Product Designer · AI Builder · Automation Architect',
      context: 'Personal AI system',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Designed the conversational operating model around memory, knowledge and project state.',
        'Built an n8n workflow for Telegram text and voice input.',
        'Connected PostgreSQL chat memory and structured knowledge.',
        'Added project search, project update, decision context and action planning tools.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: copilotEvidenceImg,
      imageAlt: 'Naïm Copilot n8n workflow screenshot showing Telegram, AI Agent, memory and project tools',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['n8n', 'Google Gemini', 'PostgreSQL', 'Telegram', 'AI Agents', 'RAG', 'MCP', 'Automation'],
    },
  },
  'career-os': {
    slug: 'career-os',
    type: 'standard',
    hero: {
      eyebrow: 'AI AUTOMATION · JOB SEARCH · SCORING',
      title: 'Career OS · Daily Job Search',
      lead: 'An automated career-search workflow that collects opportunities, removes duplicates, scores fit and sends a focused daily digest.',
      metaChips: [
        'Personal automation system',
        'Product Designer · AI Workflow Builder',
      ],
      image: dailyJobsearchCoverImg,
      imageAlt: 'Career OS n8n workflow screenshot showing job sources, deduplication, AI fit scoring and digest',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can repetitive job searching become a consistent pipeline where relevant roles are collected, evaluated and prioritized automatically?',
      role: 'Product Designer · AI Workflow Builder',
      context: 'Personal automation system',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Combined multiple remote job sources.',
        'Flattened and deduplicated results to keep only new URLs.',
        'Used an AI scoring step to assess fit against the career profile.',
        'Saved results to a pipeline and delivered email / Telegram digests.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: dailyJobsearchCoverImg,
      imageAlt: 'Career OS n8n workflow screenshot showing job sources, deduplication, AI fit scoring and digest',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['n8n', 'Google Gemini', 'Job APIs', 'PostgreSQL', 'AI scoring', 'Email', 'Telegram'],
    },
  },
  'saudi-government': {
    slug: 'saudi-government',
    type: 'standard',
    hero: {
      eyebrow: 'SAUDI ARABIA · GOVERNMENT SECTOR',
      title: 'Saudi · Government Digital Services',
      lead: 'UX/UI and low-code product work delivered through ENVNT / Wevioo for Saudi digital environments. Client project names are intentionally omitted from the public portfolio.',
      metaChips: [
        'ENVNT / Wevioo · Saudi Arabia',
        'Senior UX/UI Designer · UI Developer',
      ],
      image: dgaGovHeroImg,
      imageAlt: 'approved Saudi government digital service interface screenshot, with confidential project names removed',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can complex government requirements and workflows become clear, consistent and production-ready digital interfaces?',
      role: 'Senior UX/UI Designer · UI Developer',
      context: 'ENVNT / Wevioo · Saudi Arabia',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Translated requirements and workflows into usable interfaces.',
        'Designed responsive screens and reusable UI patterns.',
        'Collaborated with business and development teams.',
        'Implemented UI in OutSystems where required.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: dgaGovEvidenceImg,
      imageAlt: 'approved Saudi government digital service interface screenshot, with confidential project names removed',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['Figma', 'UX/UI', 'OutSystems', 'Design Systems', 'Responsive UI'],
    },
  },
  'saudi-banking': {
    slug: 'saudi-banking',
    type: 'standard',
    hero: {
      eyebrow: 'SAUDI ARABIA · BANKING SECTOR',
      title: 'Saudi · Banking & Financial Services',
      lead: 'UX/UI and Mendix interface work in a Saudi banking environment through ENVNT / Wevioo. Confidential client and project names are intentionally omitted.',
      metaChips: [
        'ENVNT / Wevioo · Saudi Arabia',
        'UX Designer · Mendix UI Developer',
      ],
      image: dgaBankingHeroImg,
      imageAlt: 'approved Saudi banking interface skeleton',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can business requirements, use cases and workflows be translated into a clear banking interface that can be implemented in a low-code environment?',
      role: 'UX Designer · Mendix UI Developer',
      context: 'ENVNT / Wevioo · Saudi Arabia',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Translated SRS, use cases and workflows into Figma interfaces.',
        'Worked with BA and development teams to clarify the experience.',
        'Implemented UI components and screens in Mendix.',
        'Worked within the context of regulated financial services.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: dgaBankingEvidenceImg,
      imageAlt: 'approved Saudi banking interface evidence skeleton',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['Figma', 'Mendix', 'UX/UI', 'SRS', 'Low-Code', 'Design Systems'],
    },
  },
  dga: {
    slug: 'dga',
    type: 'standard',
    hero: {
      eyebrow: 'SAUDI ARABIA · DIGITAL GOVERNMENT',
      title: 'DGA · Digital Government Experience',
      lead: 'A focused look at my contribution to digital government UX/UI and design-system work in Saudi Arabia.',
      metaChips: [
        'ENVNT / Wevioo · Saudi Arabia',
        'UX/UI Designer · Design System Contributor · OutSystems UI',
      ],
      image: dgaDigitalHeroImg,
      imageAlt: 'approved Saudi government digital service interface screenshot, with confidential project names removed',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can government interfaces remain consistent, accessible and implementation-ready across digital services?',
      role: 'UX/UI Designer · Design System Contributor · OutSystems UI',
      context: 'ENVNT / Wevioo · Saudi Arabia',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Worked on UX/UI for digital government services.',
        'Contributed to reusable design-system patterns.',
        'Translated visual design into OutSystems UI.',
        'Collaborated with delivery teams across design and development.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: dgaDigitalEvidenceImg,
      imageAlt: 'approved DGA-related interface or design-system screenshot, with confidential project details removed',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['Figma', 'Design Systems', 'OutSystems', 'UX/UI', 'Government Digital Services'],
    },
  },
  'saudi-regulatory': {
    slug: 'saudi-regulatory',
    type: 'standard',
    hero: {
      eyebrow: 'SAUDI ARABIA · REGULATORY / HEALTHCARE',
      title: 'Saudi · Regulatory / Healthcare Digital Services',
      lead: 'UX/UI and OutSystems interface work for regulated digital services through ENVNT / Wevioo, presented publicly by sector rather than client project name.',
      metaChips: [
        'ENVNT / Wevioo · Saudi Arabia',
        'UX/UI Designer · OutSystems UI',
      ],
      image: dgaRegHeroImg,
      imageAlt: 'approved Saudi regulatory or healthcare service interface screenshot, anonymized for public portfolio',
      caption: null,
    },
    challenge: {
      eyebrow: 'THE CHALLENGE',
      title: 'A clear problem deserves a clear product response.',
      copy: 'How can regulated service workflows be made easier to understand and use while staying consistent with an existing digital platform?',
      role: 'UX/UI Designer · OutSystems UI',
      context: 'ENVNT / Wevioo · Saudi Arabia',
    },
    contribution: {
      eyebrow: 'WHAT I DID',
      title: 'From ambiguity to a usable system.',
      items: [
        'Designed and refined service interfaces.',
        'Worked within existing product and design constraints.',
        'Created responsive UI patterns for low-code implementation.',
        'Collaborated with delivery teams to iterate on the experience.',
      ],
      process: [
        { step: '01', title: 'Frame', desc: 'Clarify the problem, users and constraints.' },
        { step: '02', title: 'Structure', desc: 'Turn requirements into flows and product logic.' },
        { step: '03', title: 'Design', desc: 'Create clear, reusable and implementation-ready UI.' },
        { step: '04', title: 'Build', desc: 'Connect the design to technology and iterate.' },
      ],
    },
    evidence: {
      eyebrow: 'SELECTED EVIDENCE',
      title: 'The work behind the interface.',
      image: dgaRegEvidenceImg,
      imageAlt: 'approved Saudi regulatory or healthcare service interface screenshot, anonymized for public portfolio',
      caption: null,
    },
    technology: {
      eyebrow: 'TECHNOLOGY',
      title: 'Technology',
      tags: ['Figma', 'OutSystems', 'UX/UI', 'Responsive Design', 'Design Systems'],
    },
  },
};
