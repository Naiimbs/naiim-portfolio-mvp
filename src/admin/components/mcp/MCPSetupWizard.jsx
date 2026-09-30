import React, { useState, useEffect } from 'react';
import { saveAdminMCPConnection } from '../../../services/agentRuntime';
import OAuthCredentialsImporter from './OAuthCredentialsImporter';

/**
 * MCP Setup Wizard Component (Admin CMS) - V2 Generic Connections.
 *
 * Steps:
 * 1. Connection (Name, Provider, Transport, Server URL, Auth Type: Bearer or OAuth 2.0)
 * 2. Test Connection (Handshake, latency, server info, safe error handling)
 * 3. Discover Tools & Final Success Summary (Real tools list, searchable, Save)
 *
 * Security:
 * - Credentials (access token, client secret, refresh token) are held in transient local state only during setup.
 * - Credentials are never stored in localStorage, Supabase, or exposed in logs.
 * - Cleared immediately upon save or cancellation.
 */
export default function MCPSetupWizard({ isOpen, onClose, onSuccess, existingConnections = [] }) {
  const [step, setStep] = useState(1); // 1: Connection, 2: Test, 3: Tools & Save

  // Step 1 Form State
  const [name, setName] = useState('n8n-main');
  const [provider, setProvider] = useState('n8n'); // 'n8n', 'custom', 'gmail'
  const [authType, setAuthType] = useState('bearer'); // 'bearer', 'oauth2'
  const [serverUrl, setServerUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  // OAuth 2.0 State
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [scopes, setScopes] = useState('');
  const [oauthConnected, setOauthConnected] = useState(false);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  // OAuth JSON Import State
  const [importedOAuthSummary, setImportedOAuthSummary] = useState(null);
  const [redirectUrisList, setRedirectUrisList] = useState([]);

  const [validationError, setValidationError] = useState('');

  // Step 2 & 3 State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Tool Search Filter (Step 3)
  const [toolSearch, setToolSearch] = useState('');

  // Auto redirect URI
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/oauth/callback`
    : 'http://localhost:5173/api/oauth/callback';

  // Listen for OAuth completion message from popup
  useEffect(() => {
    function handleOAuthMessage(event) {
      if (event.data?.type === 'MCP_OAUTH_SUCCESS') {
        setOauthConnected(true);
        setOauthConnecting(false);
        setConfigSavedMsg('✓ OAuth 2.0 authentication successful!');
        setTimeout(() => setConfigSavedMsg(''), 5000);
      }
    }
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Provider presets helper
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setValidationError('');
    const targetKey = newProvider === 'gmail' ? 'gmail-main' : newProvider === 'n8n' ? 'n8n-main' : '';
    const existing = existingConnections.find((c) => c.slug === targetKey || c.connection_key === targetKey || c.provider === newProvider);

    if (newProvider === 'gmail') {
      setName(existing?.name || 'gmail-main');
      setAuthType('oauth2');
      setServerUrl(existing?.server_url || existing?.server_url_hint || '');
      setClientId(existing?.metadata?.client_id || '');
      setAuthorizationUrl(existing?.metadata?.authorization_url || 'https://accounts.google.com/o/oauth2/v2/auth');
      setTokenUrl(existing?.metadata?.token_url || 'https://oauth2.googleapis.com/token');
      setScopes(existing?.metadata?.scopes || 'https://www.googleapis.com/auth/gmail.readonly');
      if (existing?.metadata?.redirect_uris) {
        setRedirectUrisList(existing.metadata.redirect_uris);
      }
      if (existing?.metadata?.client_id) {
        setImportedOAuthSummary({
          appType: existing?.metadata?.app_type || 'Google Cloud OAuth',
          clientId: existing?.metadata?.client_id,
          redirectUrisCount: existing?.metadata?.redirect_uris?.length || 0,
          format: 'persisted',
        });
      }
    } else if (newProvider === 'n8n') {
      setName(existing?.name || 'n8n-main');
      setAuthType('bearer');
      setServerUrl(existing?.server_url || existing?.server_url_hint || 'https://n8n.naiimbsili.com');
      setAuthorizationUrl('');
      setTokenUrl('');
      setScopes('');
      setImportedOAuthSummary(null);
      setRedirectUrisList([]);
    }
  };

  // Handler for importing OAuth credentials JSON
  const handleOAuthImport = async (normalized) => {
    setClientId(normalized.clientId);
    setClientSecret(normalized.clientSecret);
    setAuthorizationUrl(normalized.authorizationUrl);
    setTokenUrl(normalized.tokenUrl);
    setRedirectUrisList(normalized.redirectUris);
    setImportedOAuthSummary({
      appType: normalized.appType,
      clientId: normalized.clientId,
      redirectUrisCount: normalized.redirectUris.length,
      format: normalized.format,
    });
    setValidationError('');

    // Automatically persist imported configuration server-side
    try {
      const connName = name.trim() || 'gmail-main';
      const key = connName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gmail-main';

      await fetch(`/api/admin/mcp-connections/${key}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          authType: 'oauth2',
          clientId: normalized.clientId,
          clientSecret: normalized.clientSecret || undefined,
          authorizationUrl: normalized.authorizationUrl,
          tokenUrl: normalized.tokenUrl,
          scopes: scopes.trim() || 'https://www.googleapis.com/auth/gmail.readonly',
          redirectUri,
        }),
      });

      await saveAdminMCPConnection(null, {
        name: connName,
        slug: key,
        provider,
        transport: 'http',
        auth_type: 'oauth2',
        connection_key: key,
        server_url: serverUrl.trim(),
        server_url_hint: serverUrl.trim(),
        description: `${provider.toUpperCase()} MCP endpoint (OAuth 2.0).`,
        status: 'not_connected',
        is_active: true,
        metadata: {
          client_id: normalized.clientId,
          authorization_url: normalized.authorizationUrl,
          token_url: normalized.tokenUrl,
          scopes: scopes.trim() || 'https://www.googleapis.com/auth/gmail.readonly',
          redirect_uri: redirectUri,
          redirect_uris: normalized.redirectUris,
          app_type: normalized.appType,
        },
      });

      setConfigSavedMsg('✓ OAuth 2.0 credentials imported and saved server-side.');
      setTimeout(() => setConfigSavedMsg(''), 4500);
    } catch (saveErr) {
      console.warn('[OAuth Debug] Auto-persistence after import error:', saveErr.message);
    }
  };

  // Handler for clearing imported OAuth credentials
  const handleClearOAuthImport = () => {
    setImportedOAuthSummary(null);
    setClientId('');
    setClientSecret('');
    setAuthorizationUrl('');
    setTokenUrl('');
    setRedirectUrisList([]);
  };

  // Reset or clear sensitive state when closed
  const handleClose = () => {
    setAccessToken('');
    setClientSecret('');
    setImportedOAuthSummary(null);
    setRedirectUrisList([]);
    setTestResult(null);
    setValidationError('');
    setSaveError('');
    setConfigSavedMsg('');
    setOauthConnected(false);
    setOauthConnecting(false);
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  // Derive connection key from name (e.g. 'n8n-main', 'gmail-main')
  const connectionKey = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'n8n-main';

  // Client-side validation for Step 1
  const validateStep1 = () => {
    if (!name.trim()) {
      setValidationError('Connection Name is required.');
      return false;
    }
    if (!serverUrl.trim()) {
      setValidationError('MCP Server URL is required.');
      return false;
    }
    try {
      const parsed = new URL(serverUrl.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setValidationError('URL must start with http:// or https://');
        return false;
      }
    } catch {
      setValidationError('Please enter a valid MCP Server URL (e.g. https://your-instance.n8n.cloud/mcp-server/http).');
      return false;
    }

    if (authType === 'bearer') {
      if (!accessToken.trim()) {
        setValidationError('Access Token is required to authenticate with the MCP server.');
        return false;
      }
    } else if (authType === 'oauth2') {
      if (!clientId.trim()) {
        setValidationError('Client ID is required for OAuth 2.0.');
        return false;
      }
      if (!authorizationUrl.trim()) {
        setValidationError('Authorization URL is required for OAuth 2.0.');
        return false;
      }
      if (!tokenUrl.trim()) {
        setValidationError('Token URL is required for OAuth 2.0.');
        return false;
      }
      if (!oauthConnected) {
        setValidationError('Please complete the "Connect with OAuth" flow before testing.');
        return false;
      }
    }

    setValidationError('');
    return true;
  };

  // Save OAuth Configuration Server-side
  const handleSaveOAuthConfiguration = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) {
      setValidationError('Connection Name is required.');
      return false;
    }
    if (authType === 'oauth2' && (!clientId.trim() || !authorizationUrl.trim() || !tokenUrl.trim())) {
      setValidationError('Please provide Client ID, Authorization URL, and Token URL.');
      return false;
    }

    setValidationError('');
    try {
      console.log('[OAuth Debug] Saving OAuth credentials server-side for connection:', connectionKey);
      // 1. Save server-side credentials
      const res = await fetch(`/api/admin/mcp-connections/${connectionKey}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          authType: 'oauth2',
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim() || undefined,
          authorizationUrl: authorizationUrl.trim(),
          tokenUrl: tokenUrl.trim(),
          scopes: scopes.trim(),
          redirectUri,
        }),
      });

      console.log('[OAuth Debug] Credentials save response status:', res.status);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error?.message || 'Failed to save OAuth configuration server-side.');
      }

      // 2. Persist safe metadata to Supabase / CMS
      await saveAdminMCPConnection(null, {
        name: name.trim(),
        slug: connectionKey,
        provider,
        transport: 'http',
        auth_type: 'oauth2',
        connection_key: connectionKey,
        server_url: serverUrl.trim(),
        server_url_hint: serverUrl.trim(),
        description: `${provider.toUpperCase()} MCP endpoint (OAuth 2.0).`,
        status: oauthConnected ? 'connected' : 'not_connected',
        is_active: true,
        metadata: {
          client_id: clientId.trim(),
          authorization_url: authorizationUrl.trim(),
          token_url: tokenUrl.trim(),
          scopes: scopes.trim(),
          redirectUri,
          ...(redirectUrisList.length > 0 ? { redirect_uris: redirectUrisList } : {}),
          ...(importedOAuthSummary?.appType ? { app_type: importedOAuthSummary.appType } : {}),
        },
      });

      setConfigSavedMsg('OAuth 2.0 configuration saved server-side.');
      setTimeout(() => setConfigSavedMsg(''), 4000);
      return true;
    } catch (err) {
      console.warn('[OAuth Debug] Save configuration error:', err.message);
      setValidationError(err.message || 'Error saving configuration.');
      return false;
    }
  };

  // Initiate OAuth Authorization Flow
  const handleConnectOAuth = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[OAuth Debug] Connect button clicked');
    setValidationError('');

    const saved = await handleSaveOAuthConfiguration(e);
    if (!saved) return;

    setOauthConnecting(true);

    try {
      console.log('[OAuth Debug] OAuth start requested for connection:', connectionKey);
      const res = await fetch(`/api/admin/mcp-connections/${connectionKey}/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationUrl: authorizationUrl.trim(),
          clientId: clientId.trim(),
          scopes: scopes.trim(),
          redirectUri,
        }),
      });

      console.log('[OAuth Debug] OAuth authorize HTTP status:', res.status);
      const data = await res.json();
      console.log('[OAuth Debug] OAuth authorize response:', {
        ok: Boolean(data.ok),
        hasAuthorizeUrl: Boolean(data.authorizeUrl),
        error: data.code || data.error?.code || null,
      });

      if (!data.ok || !data.authorizeUrl) {
        const errMsg = data.message || data.error?.message || 'Failed to generate OAuth authorization URL.';
        throw new Error(errMsg);
      }

      console.log('[OAuth Debug] Redirect URL generated successfully. Navigating to authorization URL...');

      // Explicit browser navigation to provider authorization URL
      window.location.href = data.authorizeUrl;
    } catch (err) {
      console.error('[OAuth Debug] OAuth initiation error:', err.message);
      setValidationError(err.message || 'OAuth authorization initiation failed.');
      setOauthConnecting(false);
    }
  };

  // Step 1 -> Step 2: Trigger real connection test
  const handleStartTest = async () => {
    if (!validateStep1()) return;

    setStep(2);
    setTesting(true);
    setTestResult(null);

    try {
      const body = {
        serverUrl: serverUrl.trim(),
      };
      if (authType === 'bearer') {
        body.accessToken = accessToken.trim();
      }

      const res = await fetch(`/api/admin/mcp-connections/${connectionKey}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setTestResult(data);

      // If successful, transition to Step 3 after brief visual confirmation
      if (data.success && data.status === 'connected') {
        setTimeout(() => {
          setStep(3);
        }, 1100);
      }
    } catch (err) {
      setTestResult({
        ok: false,
        success: false,
        status: 'unavailable',
        error: {
          code: 'NETWORK_ERROR',
          message: "We couldn't connect to this MCP server.",
          reason: 'Network error or API server unavailable.',
        },
      });
    } finally {
      setTesting(false);
    }
  };

  // Step 3: Save Connection
  const handleSaveConnection = async () => {
    setSaving(true);
    setSaveError('');

    try {
      // 1. Save server-side credentials strictly in node environment (.env)
      const credsBody = {
        serverUrl: serverUrl.trim(),
        authType,
      };

      if (authType === 'bearer') {
        credsBody.accessToken = accessToken.trim();
      } else {
        credsBody.clientId = clientId.trim();
        if (clientSecret.trim()) credsBody.clientSecret = clientSecret.trim();
        credsBody.authorizationUrl = authorizationUrl.trim();
        credsBody.tokenUrl = tokenUrl.trim();
        credsBody.scopes = scopes.trim();
        credsBody.redirectUri = redirectUri;
      }

      const credsRes = await fetch(`/api/admin/mcp-connections/${connectionKey}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credsBody),
      });

      if (!credsRes.ok) {
        throw new Error('Failed to save server-side credentials securely.');
      }

      // 2. Persist safe connection metadata to Supabase / CMS registry
      const saveRes = await saveAdminMCPConnection(null, {
        name: name.trim(),
        slug: connectionKey,
        provider,
        transport: 'http',
        auth_type: authType,
        connection_key: connectionKey,
        server_url: serverUrl.trim(),
        server_url_hint: serverUrl.trim(),
        description: `Connected to ${testResult?.serverInfo?.name || provider} MCP server (${testResult?.toolsCount || 0} tools available).`,
        status: 'active',
        is_active: true,
        metadata: {
          transport: 'http',
          auth_type: authType,
          ...(authType === 'oauth2'
            ? {
                client_id: clientId.trim(),
                authorization_url: authorizationUrl.trim(),
                token_url: tokenUrl.trim(),
                scopes: scopes.trim(),
                redirect_uri: redirectUri,
                ...(redirectUrisList.length > 0 ? { redirect_uris: redirectUrisList } : {}),
                ...(importedOAuthSummary?.appType ? { app_type: importedOAuthSummary.appType } : {}),
              }
            : {}),
        },
      });

      if (saveRes.error) {
        throw new Error(saveRes.error.message || 'Failed to persist MCP connection.');
      }

      // 3. Clear sensitive tokens immediately from React state
      setAccessToken('');
      setClientSecret('');

      const isUpdated = Boolean(saveRes?.isUpdate || isExisting);
      if (onSuccess) {
        onSuccess(connectionKey, testResult, isUpdated);
      }
      handleClose();
    } catch (err) {
      setSaveError(err.message || 'Error occurred while saving connection.');
      setSaving(false);
    }
  };

  const isExisting = (existingConnections || []).some(
    (c) => c.slug === connectionKey || c.connection_key === connectionKey
  );

  // Filter tools in Step 3
  const toolsList = testResult?.tools || [];
  const filteredTools = toolsList.filter((t) => {
    const q = toolSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '680px' }}>
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-light">
            <div>
              <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Connect your MCP server
              </h5>
              <div className="text-muted small">
                Connect an MCP server to make its tools available to your AI agents.
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleClose}
              disabled={saving}
            ></button>
          </div>

          {/* Stepper Indicator */}
          <div className="px-4 pt-3 pb-2 bg-white border-bottom">
            <div className="d-flex align-items-center justify-content-between small">
              <div className={`d-flex align-items-center gap-2 ${step === 1 ? 'text-primary fw-bold' : step > 1 ? 'text-success' : 'text-muted'}`}>
                <span
                  className={`badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center ${
                    step === 1 ? 'bg-primary text-white' : step > 1 ? 'bg-success text-white' : 'bg-light text-dark border'
                  }`}
                  style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}
                >
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Connection</span>
              </div>

              <i className="bi bi-chevron-right text-muted opacity-50 small"></i>

              <div className={`d-flex align-items-center gap-2 ${step === 2 ? 'text-primary fw-bold' : step > 2 ? 'text-success' : 'text-muted'}`}>
                <span
                  className={`badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center ${
                    step === 2 ? 'bg-primary text-white' : step > 2 ? 'bg-success text-white' : 'bg-light text-dark border'
                  }`}
                  style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}
                >
                  {step > 2 ? '✓' : '2'}
                </span>
                <span>Test</span>
              </div>

              <i className="bi bi-chevron-right text-muted opacity-50 small"></i>

              <div className={`d-flex align-items-center gap-2 ${step === 3 ? 'text-primary fw-bold' : 'text-muted'}`}>
                <span
                  className={`badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center ${
                    step === 3 ? 'bg-primary text-white' : 'bg-light text-dark border'
                  }`}
                  style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}
                >
                  3
                </span>
                <span>Tools & Save</span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body px-4 py-4" style={{ maxHeight: 'calc(85vh - 160px)', overflowY: 'auto' }}>
            {/* ========================================================================= */}
            {/* STEP 1: Connection Form */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div>
                {validationError && (
                  <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                    <div>{validationError}</div>
                  </div>
                )}

                {configSavedMsg && (
                  <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                    <div>{configSavedMsg}</div>
                  </div>
                )}

                {/* Connection Name & Provider Row */}
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label className="form-label small fw-bold mb-1" htmlFor="mcp-conn-name">
                      Connection Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="mcp-conn-name"
                      type="text"
                      className="form-control admin-input font-monospace"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. n8n-main"
                      required
                    />
                    <div className="form-text small text-muted">
                      Key: <code>{connectionKey}</code>
                    </div>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label small fw-bold mb-1" htmlFor="mcp-provider">
                      Provider
                    </label>
                    <select
                      id="mcp-provider"
                      className="form-select admin-input"
                      value={provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                    >
                      <option value="n8n">n8n Platform</option>
                      <option value="custom">Custom MCP</option>
                      <option value="gmail">Gmail (OAuth 2.0)</option>
                    </select>
                  </div>
                </div>

                {/* Server URL */}
                <div className="mb-3">
                  <label className="form-label small fw-bold mb-1" htmlFor="mcp-server-url">
                    MCP Server URL <span className="text-danger">*</span>
                  </label>
                  <input
                    id="mcp-server-url"
                    type="url"
                    className="form-control admin-input font-monospace"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://your-instance.n8n.cloud/mcp-server/http"
                    required
                  />
                  <div className="form-text small text-muted">
                    The HTTP endpoint for your MCP server.
                  </div>
                </div>

                {/* Authentication Method Selector */}
                <div className="mb-3">
                  <label className="form-label small fw-bold mb-1" htmlFor="mcp-auth-type">
                    Authentication <span className="text-danger">*</span>
                  </label>
                  <select
                    id="mcp-auth-type"
                    className="form-select admin-input"
                    value={authType}
                    onChange={(e) => {
                      setAuthType(e.target.value);
                      setValidationError('');
                    }}
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="oauth2">OAuth 2.0</option>
                  </select>
                  <div className="form-text small text-muted">
                    Select the authentication scheme required by your MCP host.
                  </div>
                </div>

                {/* ================= BEARER TOKEN FIELDS ================= */}
                {authType === 'bearer' && (
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <label className="form-label small fw-bold mb-1" htmlFor="mcp-access-token">
                      Access Token <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        id="mcp-access-token"
                        type={showToken ? 'text' : 'password'}
                        className="form-control admin-input font-monospace"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Enter MCP Access Token"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-3"
                        onClick={() => setShowToken(!showToken)}
                        title={showToken ? 'Hide token' : 'Show token'}
                        tabIndex="-1"
                      >
                        <i className={`bi ${showToken ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    <div className="form-text small text-muted d-flex align-items-center gap-1 mt-2">
                      <i className="bi bi-shield-lock-fill text-success"></i>
                      <span>Never displayed in frontend after connection is saved. Stored server-side only.</span>
                    </div>
                  </div>
                )}

                {/* ================= OAUTH 2.0 FIELDS ================= */}
                {authType === 'oauth2' && (
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                      <span className="small fw-bold text-dark">OAuth 2.0 Credentials</span>
                      {oauthConnected ? (
                        <span className="badge bg-success text-white">
                          <i className="bi bi-check-circle-fill me-1"></i> Connected
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border">
                          Not connected
                        </span>
                      )}
                    </div>

                    {/* Generic OAuth JSON Importer */}
                    <OAuthCredentialsImporter
                      onImport={handleOAuthImport}
                      importedSummary={importedOAuthSummary}
                      onClearImport={handleClearOAuthImport}
                      disabled={oauthConnecting}
                    />

                    <div className="mb-2">
                      <label className="form-label small fw-bold mb-1" htmlFor="mcp-oauth-client-id">
                        Client ID <span className="text-danger">*</span>
                      </label>
                      <input
                        id="mcp-oauth-client-id"
                        type="text"
                        className="form-control form-control-sm admin-input font-monospace"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-bold mb-1" htmlFor="mcp-oauth-client-secret">
                        Client Secret <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <input
                          id="mcp-oauth-client-secret"
                          type={showClientSecret ? 'text' : 'password'}
                          className="form-control form-control-sm admin-input font-monospace"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          placeholder="Enter OAuth Client Secret"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-2"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                          tabIndex="-1"
                        >
                          <i className={`bi ${showClientSecret ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold mb-1" htmlFor="mcp-oauth-auth-url">
                          Authorization URL <span className="text-danger">*</span>
                        </label>
                        <input
                          id="mcp-oauth-auth-url"
                          type="url"
                          className="form-control form-control-sm admin-input font-monospace"
                          value={authorizationUrl}
                          onChange={(e) => setAuthorizationUrl(e.target.value)}
                          placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold mb-1" htmlFor="mcp-oauth-token-url">
                          Token URL <span className="text-danger">*</span>
                        </label>
                        <input
                          id="mcp-oauth-token-url"
                          type="url"
                          className="form-control form-control-sm admin-input font-monospace"
                          value={tokenUrl}
                          onChange={(e) => setTokenUrl(e.target.value)}
                          placeholder="https://oauth2.googleapis.com/token"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-bold mb-1" htmlFor="mcp-oauth-scopes">
                        Scopes
                      </label>
                      <input
                        id="mcp-oauth-scopes"
                        type="text"
                        className="form-control form-control-sm admin-input font-monospace"
                        value={scopes}
                        onChange={(e) => setScopes(e.target.value)}
                        placeholder="e.g. https://www.googleapis.com/auth/gmail.readonly"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold mb-1">Redirect URI (Callback)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm admin-input font-monospace text-muted"
                        value={redirectUri}
                        readOnly
                      />
                      <div className="form-text small text-muted" style={{ fontSize: '0.72rem' }}>
                        Add this exact redirect URI to your OAuth provider's authorized callbacks.
                      </div>
                    </div>

                    {/* OAuth Action Buttons */}
                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleSaveOAuthConfiguration}
                      >
                        <i className="bi bi-save me-1"></i> Save Configuration
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary fw-bold px-3"
                        onClick={handleConnectOAuth}
                        disabled={oauthConnecting}
                      >
                        {oauthConnecting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span> Connecting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-box-arrow-up-right me-1"></i> Connect with OAuth
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: Test Connection */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div>
                {testing && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>
                    <div className="fw-bold text-dark mb-1">Connecting to MCP server...</div>
                    <div className="text-muted small font-monospace text-truncate px-3">
                      {serverUrl}
                    </div>
                  </div>
                )}

                {!testing && testResult?.success && (
                  <div className="p-4 rounded-3 border border-success bg-success-subtle text-success-emphasis text-center">
                    <div className="d-inline-flex p-3 rounded-circle bg-success text-white mb-3">
                      <i className="bi bi-check-lg fs-3"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Connected</h5>
                    <p className="small text-muted mb-3">
                      MCP handshake verified successfully. Discovering tools...
                    </p>

                    <div className="bg-white p-3 rounded border text-start small font-monospace">
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted">Server URL:</span>
                        <strong className="text-dark text-truncate ms-2" style={{ maxWidth: '320px' }}>
                          {testResult.serverUrl}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted">Auth Scheme:</span>
                        <strong className="text-dark text-uppercase">{authType}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted">Server Info:</span>
                        <strong className="text-dark">
                          {testResult.serverInfo?.name || 'mcp-server'} ({testResult.serverInfo?.version || '1.0.0'})
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted">Protocol:</span>
                        <strong className="text-dark">{testResult.protocolVersion || '2024-11-05'}</strong>
                      </div>
                      {testResult.latencyMs !== undefined && (
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted">Latency:</span>
                          <strong className="text-success">{testResult.latencyMs}ms</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!testing && !testResult?.success && (
                  <div className="p-4 rounded-3 border border-danger bg-danger-subtle text-danger-emphasis">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="p-2 rounded-circle bg-danger text-white flex-shrink-0">
                        <i className="bi bi-x-lg fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">
                          We couldn't connect to this MCP server.
                        </h6>
                        <div className="text-danger small">
                          {testResult?.error?.reason || testResult?.error?.message || 'The MCP server could not be reached.'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded border small font-monospace text-muted mb-3">
                      <div>Target Host: {serverUrl ? new URL(serverUrl).host : 'N/A'}</div>
                      <div>Code: {testResult?.error?.code || 'MCP_CONNECTION_FAILED'}</div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn btn-sm btn-outline-secondary px-3"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleStartTest}
                        className="btn btn-sm btn-danger px-3 fw-bold"
                      >
                        <i className="bi bi-arrow-repeat me-1"></i> Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: Discover Tools & Final Success Summary */}
            {/* ========================================================================= */}
            {step === 3 && (
              <div>
                {/* Final Success Summary Header */}
                <div className="p-3 rounded-3 bg-light border mb-4">
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-2">
                    <i className="bi bi-check-circle-fill fs-5"></i>
                    <h6 className="mb-0 fw-bold text-dark">MCP connected successfully</h6>
                  </div>

                  <div className="row g-2 small font-monospace">
                    <div className="col-6">
                      <span className="text-muted">Connection:</span>{' '}
                      <strong className="text-dark">{connectionKey}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Provider:</span>{' '}
                      <strong className="text-dark text-uppercase">{provider}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Auth:</span>{' '}
                      <strong className="text-dark text-uppercase">{authType}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Tools:</span>{' '}
                      <strong className="text-success fw-bold">{testResult?.toolsCount || toolsList.length} available</strong>
                    </div>
                  </div>
                </div>

                {isExisting && (
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-info-circle-fill flex-shrink-0"></i>
                    <div>This connection already exists. Your configuration will be updated.</div>
                  </div>
                )}

                {saveError && (
                  <div className="alert alert-danger py-2 px-3 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    {saveError}
                  </div>
                )}

                {/* Searchable Tools List */}
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="fw-bold small text-dark">
                    Available Tools ({toolsList.length})
                  </span>
                  <div style={{ maxWidth: '240px' }} className="w-100">
                    <input
                      type="text"
                      className="form-control form-control-sm admin-input"
                      placeholder="Search tools..."
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  className="border rounded-2 p-2 bg-light d-flex flex-column gap-2"
                  style={{ maxHeight: '220px', overflowY: 'auto' }}
                >
                  {filteredTools.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      {toolSearch ? 'No tools match your search.' : '0 tools returned by MCP server.'}
                    </div>
                  ) : (
                    filteredTools.map((tool) => (
                      <div key={tool.name} className="p-2 bg-white rounded border small">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <strong className="font-monospace text-primary">{tool.name}</strong>
                          {tool.category && (
                            <span className="badge bg-light text-dark border small" style={{ fontSize: '0.65rem' }}>
                              {tool.category}
                            </span>
                          )}
                        </div>
                        {tool.description && (
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                            {tool.description}
                          </div>
                        )}
                        {tool.parameters && tool.parameters.length > 0 && (
                          <div className="text-secondary small mt-1 font-monospace" style={{ fontSize: '0.7rem' }}>
                            params: {tool.parameters.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
            {step === 1 && (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary px-3 py-2"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary px-3 py-2"
                    onClick={async () => {
                      const ok = await handleSaveOAuthConfiguration();
                      if (ok) {
                        if (onSuccess) onSuccess(connectionKey, null, true);
                        handleClose();
                      }
                    }}
                    disabled={!name.trim() || (authType === 'oauth2' && !clientId.trim())}
                    title="Save connection configuration and exit"
                  >
                    <i className="bi bi-save me-1"></i> Save Configuration
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary px-4 py-2 fw-bold"
                    onClick={handleStartTest}
                    disabled={
                      !name.trim() ||
                      !serverUrl.trim() ||
                      (authType === 'bearer' && !accessToken.trim()) ||
                      (authType === 'oauth2' && !oauthConnected)
                    }
                    title={
                      !serverUrl.trim()
                        ? 'MCP Server URL is required to test upstream connection'
                        : authType === 'oauth2' && !oauthConnected
                        ? 'Please complete OAuth authentication first'
                        : 'Test connection'
                    }
                  >
                    <i className="bi bi-broadcast me-1"></i> Test Connection
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary px-3 py-2"
                  onClick={() => setStep(1)}
                  disabled={testing}
                >
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                {testResult?.success && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary px-3 py-2 fw-bold"
                    onClick={() => setStep(3)}
                  >
                    Discover Tools <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary px-3 py-2"
                  onClick={() => setStep(1)}
                  disabled={saving}
                >
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary px-4 py-2 fw-bold"
                  onClick={handleSaveConnection}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span> Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-1"></i> Save Connection
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
