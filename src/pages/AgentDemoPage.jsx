import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import AgentDemoShell from '../components/agents/demo/AgentDemoShell';
import AgentDemoInput from '../components/agents/demo/AgentDemoInput';
import AgentDemoResult from '../components/agents/demo/AgentDemoResult';
import AgentDemoStatus from '../components/agents/demo/AgentDemoStatus';
import { getPublishedAgentBySlug } from '../services/agents';
import { answerFor } from '../components/copilot/copilotMock';
import '../styles/agent-demo.css';

const COPILOT_SUGGESTIONS = [
  { text: "What are Naïm's strongest product design skills?", question: "What are Naïm's strongest skills?" },
  { text: 'Which AI and n8n automation projects did he build?', question: 'What AI tools does he use?' },
  { text: 'Show me Saudi digital government and banking work', question: 'Show me relevant projects.' },
  { text: 'How does Naïm approach problem framing and design systems?', question: 'Why should I work with Naïm?' },
];

export default function AgentDemoPage() {
  const { slug } = useParams();
  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(true);

  // Execution state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error' | 'disabled'

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoadingAgent(true);
      const res = await getPublishedAgentBySlug(slug);
      if (res.data) {
        setAgent(res.data);
        if (res.data.demo_type === 'none') {
          setStatus('disabled');
        }
      }
      setLoadingAgent(false);
    }
    load();
  }, [slug]);

  const handleRun = async (queryText) => {
    const textToRun = queryText || input;
    if (!textToRun.trim()) return;

    setLoading(true);
    setError(null);
    setStatus('loading');

    try {
      // 1. Call Secure Server-Side MCP Gateway Endpoint
      const response = await fetch(`/api/agents/${slug}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: textToRun,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data?.error || { message: 'Copilot is temporarily unavailable. Please try again later.' });
        setStatus('error');
      } else {
        setResult(data.data);
        setStatus('success');
      }
    } catch (err) {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the agent gateway. Please check your internet connection.',
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setError(null);
    setStatus(agent?.demo_type === 'none' ? 'disabled' : 'idle');
  };

  if (loadingAgent) {
    return (
      <MainLayout>
        <div className="d-flex align-items-center justify-content-center min-vh-100">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading Agent Demo...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!agent) {
    return (
      <MainLayout>
        <div className="container text-center py-5 my-5">
          <h2>Agent Not Found</h2>
          <p className="text-muted">The requested agent demo does not exist.</p>
          <Link to="/agents" className="btn btn-dark rounded-pill px-4 mt-3">
            Back to AI Agents
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={`${agent.name} — Interactive AI Demo`}
        description={`Test and interact with ${agent.name} live in your browser.`}
        canonical={`/agents/${slug}/demo`}
        robots="noindex, follow"
      />

      <AgentDemoShell
        agent={agent}
        title={`${agent.name} Interactive Demo`}
        subtitle={agent.short_description}
      >
        <div className="row justify-content-center">
          <div className="col-lg-9">
            {/* Status & Error Alerts */}
            <AgentDemoStatus
              status={status}
              error={error}
              agentSlug={slug}
              onRetry={() => handleRun(input)}
            />

            {/* Input Form */}
            {status !== 'disabled' && (
              <AgentDemoInput
                input={input}
                setInput={setInput}
                onRun={handleRun}
                loading={loading}
                disabled={status === 'disabled'}
                placeholder={`Ask ${agent.name} anything regarding projects, skills, or workflows...`}
                suggestions={slug === 'naim-copilot' ? COPILOT_SUGGESTIONS : []}
                maxLength={1000}
              />
            )}

            {/* Results Output */}
            {(result || loading) && (
              <AgentDemoResult
                result={result}
                loading={loading}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </AgentDemoShell>
    </MainLayout>
  );
}
