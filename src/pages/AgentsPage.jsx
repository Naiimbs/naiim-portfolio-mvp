import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import AgentGrid from '../components/agents/AgentGrid';
import { getPublishedAgents } from '../services/agents';
import { siteConfig } from '../config/site';
import '../styles/agents.css';

export default function AgentsPage() {
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadAgents() {
      setLoading(true);
      const res = await getPublishedAgents();
      setAgentsList(res.data || []);
      setLoading(false);
    }
    loadAgents();
  }, []);

  const featuredAgents = agentsList.filter((a) => a.is_featured);
  const allAgents = agentsList;

  const agentsSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Agents & Automation Systems — Naïm Bsili',
    description: 'A portfolio of AI Agents, n8n workflow systems, and LLM reasoning pipelines built by Naïm Bsili.',
    url: `${siteConfig.url}/agents`,
    author: {
      '@type': 'Person',
      name: siteConfig.name,
    },
  };

  return (
    <MainLayout>
      <SEO
        title="AI Agents & Intelligent Automations"
        description="Autonomous agents, n8n orchestration pipelines, and personal AI systems built by Naïm Bsili."
        canonical="/agents"
        schema={agentsSchema}
      />

      {/* 1. Hero Section */}
      <section className="agents-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> AI AGENTS & AUTOMATION LAB
          </div>
          <h1>Autonomous Agents & Workflow Systems</h1>
          <p>
            Small systems that turn repetitive work into useful actions. Combining conversational reasoning,
            vector memory, n8n orchestration, and custom tool integrations.
          </p>
        </div>
      </section>

      {/* 2. Agents Directory */}
      <section className="section-pad pt-4 pb-5">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading AI Agents...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="section-heading mb-4">
                <div className="eyebrow">
                  <span></span> ACTIVE AGENTS
                </div>
                <h2>Explore Built Systems</h2>
                <p>Detailed architecture breakdowns, live prototypes, and workflow decision trees.</p>
              </div>

              <AgentGrid agents={allAgents} />
            </>
          )}
        </div>
      </section>

      {/* 3. Contact CTA */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between align-items-center">
          <a href="/#work" className="text-link">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </a>
          <a href="#contact" className="text-link">
            Build an Agent together <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
