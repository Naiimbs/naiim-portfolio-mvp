export const answerFor = (question) => {
  const q = question.toLowerCase();

  if (q.includes('skill')) {
    return "Naïm combines UX/UI, Product Design, Design Systems, AI-driven product work, Low-Code and Product Operations.";
  }
  if (q.includes('project')) {
    return "Relevant work includes WINNI, Assestini, Naïm Copilot, Career OS, and UX/UI work across Saudi government, banking and regulatory sectors.";
  }
  if (q.includes('ai') || q.includes('tool')) {
    return "His current AI stack includes n8n, AI agents, RAG, MCP, Google AI Studio, Claude and AI-assisted product workflows.";
  }
  if (q.includes('available') || q.includes('project')) {
    return "For collaboration, use the Let's Talk button below. The public site can later connect this flow to Naïm's real n8n agent.";
  }
  if (q.includes('why')) {
    return "His approach combines product thinking, UX/UI design and hands-on AI/Low-Code building, allowing ideas to move from concept toward a working product.";
  }
  return "I can answer questions about Naïm's experience, skills, projects, AI work and career direction. This portfolio UI is ready to connect to the real n8n Copilot.";
};
