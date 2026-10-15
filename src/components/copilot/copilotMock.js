const ANSWERS = {
  en: {
    skills: "Naïm combines UX/UI, Product Design, Design Systems, AI-driven product work, Low-Code and Product Operations.",
    projects: "Relevant work includes WINNI, Assestini, Naïm Copilot, Career OS, and UX/UI work across Saudi government, banking and regulatory sectors.",
    ai: "His current AI stack includes n8n, AI agents, RAG, MCP, Google AI Studio, Claude and AI-assisted product workflows.",
    available: "For collaboration, use the Let's Talk button below. The public site can later connect this flow to Naïm's real n8n agent.",
    why: "His approach combines product thinking, UX/UI design and hands-on AI/Low-Code building, allowing ideas to move from concept toward a working product.",
    default: "I can answer questions about Naïm's experience, skills, projects, AI work and career direction. This portfolio UI is ready to connect to the real n8n Copilot.",
  },
  fr: {
    skills: "Naïm allie UX/UI, Design Produit, Design Systems, conception assistée par IA, Low-Code et Product Operations.",
    projects: "Ses projets phares incluent WINNI, Assestini, Naïm Copilot, Career OS, ainsi que des réalisations UX/UI pour le secteur public saoudien, bancaire et réglementaire.",
    ai: "Sa stack IA actuelle comprend n8n, les agents IA, RAG, MCP, Google AI Studio, Claude et les flux de travail assistés par IA.",
    available: "Pour collaborer, utilisez le bouton « Discutons » ci-dessous. Cette interface est prête à être connectée à l'agent n8n réel de Naïm.",
    why: "Son approche associe vision produit, design UX/UI et développement concret en IA/Low-Code, transformant rapidement une idée en produit fonctionnel.",
    default: "Je peux répondre à vos questions sur l'expérience, les compétences, les projets et l'orientation de Naïm. Cette interface est prête à être connectée au Copilot n8n réel.",
  },
  ar: {
    skills: "يجمع نعيم بين تصميم تجربة وواجهة المستخدم، وتصميم المنتجات، وأنظمة التصميم، وحلول الذكاء الاصطناعي، والـ Low-Code، وإدارة عمليات المنتجات.",
    projects: "تشمل أعماله البارزة: WINNI، وAssestini، وNaïm Copilot، وCareer OS، بالإضافة إلى مشاريع تصميم للمؤسسات الحكومية والبنكية والتنظيمية السعودية.",
    ai: "تتضمن أدوات الذكاء الاصطناعي الحالية لديه: n8n، والوكلاء الأذكياء، وRAG، وMCP، وGoogle AI Studio، وClaude، وتدفقات العمل المدعومة بالذكاء الاصطناعي.",
    available: "للتعاون، استخدم زر «لنتحدث» أدناه. هذا النموذج جاهز للربط مع وكيل n8n الفعلي لنعيم.",
    why: "يجمع منهجه بين التفكير في المنتج، وتصميم تجربة المستخدم، والبناء الفعلي بالذكاء الاصطناعي والـ Low-Code، مما ينقل الأفكار من مجرد مفهوم إلى منتج واقعي.",
    default: "يمكنني الإجابة على استفساراتكم حول خبرات نعيم ومهاراته ومشاريعه ومساره المهني. الواجهة مهيأة للربط المباشر مع وكيل n8n الحقيقي.",
  },
};

export const answerFor = (question, lang = 'en') => {
  const currentLang = (lang && lang.startsWith('ar'))
    ? 'ar'
    : (lang && lang.startsWith('fr') ? 'fr' : 'en');
  const bundle = ANSWERS[currentLang] || ANSWERS.en;

  const q = (question || '').toLowerCase();

  if (q.includes('skill') || q.includes('compétence') || q.includes('مهار')) {
    return bundle.skills;
  }
  if (q.includes('project') || q.includes('projet') || q.includes('مشروع') || q.includes('مشاريع')) {
    return bundle.projects;
  }
  if (q.includes('ai') || q.includes('ia') || q.includes('tool') || q.includes('outil') || q.includes('ذكاء') || q.includes('أداة') || q.includes('أدوات')) {
    return bundle.ai;
  }
  if (q.includes('available') || q.includes('disponible') || q.includes('متاح')) {
    return bundle.available;
  }
  if (q.includes('why') || q.includes('pourquoi') || q.includes('لماذا') || q.includes('ليه')) {
    return bundle.why;
  }
  return bundle.default;
};
