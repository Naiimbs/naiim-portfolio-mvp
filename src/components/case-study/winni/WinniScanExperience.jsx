import React from 'react';

export default function WinniScanExperience() {
  return (
    <section className="winni-section alt-bg" id="scan-experience">
      <div className="container">
        <div className="winni-section-header text-center mx-auto">
          <span className="winni-section-num">05 · THE SCAN EXPERIENCE</span>
          <h2 className="winni-section-title">One scan. One clear path.</h2>
          <p className="winni-copy-lg">
            This is the core interface of WINNI: five sequential mobile states engineered to move from a physical glance
            to a resolved contact in seconds.
          </p>
        </div>

        {/* 5 High-Fidelity Large Mobile UI Screens */}
        <div className="winni-screens-row">
          {/* Screen 01: Scan */}
          <div className="winni-screen-col">
            <div className="winni-screen-step">01 — SCAN</div>
            <div className="winni-screen-label">Recognized</div>
            <div className="winni-phone-frame">
              <div className="winni-phone-speaker"></div>
              <div className="winni-phone-screen">
                <div className="winni-phone-brand">WINNI</div>

                <div className="phone-card text-center py-3">
                  <div className="phone-tag active">
                    <i className="bi bi-check2-circle"></i> WINNI ID ACTIF
                  </div>
                  <div className="fw-bold fs-6 mt-1">Vous avez trouvé un objet WINNI</div>
                  <div className="text-muted small mt-1">Véhicule identifié en toute sécurité.</div>
                </div>

                <div className="phone-card bg-white">
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    OBJET SÉCURISÉ
                  </div>
                  <div className="fw-bold mt-1">
                    <i className="bi bi-car-front text-dark"></i> Véhicule Automobile
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                    ID: WN-2026-R18G8
                  </div>
                </div>

                <div className="mt-auto">
                  <p className="text-center text-muted" style={{ fontSize: '0.68rem', marginBottom: '8px' }}>
                    Le propriétaire a activé la mise en relation sécurisée.
                  </p>
                  <button className="phone-btn-primary" type="button">
                    <i className="bi bi-chat-text-fill me-1"></i> Contacter le propriétaire
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screen 02: Reach */}
          <div className="winni-screen-col">
            <div className="winni-screen-step">02 — REACH</div>
            <div className="winni-screen-label">Safe Contact</div>
            <div className="winni-phone-frame">
              <div className="winni-phone-speaker"></div>
              <div className="winni-phone-screen">
                <div className="winni-phone-brand">WINNI</div>

                <div className="mb-2">
                  <span className="phone-tag">
                    <i className="bi bi-lock-fill"></i> Canal Privé
                  </span>
                  <div className="fw-bold" style={{ fontSize: '0.88rem' }}>
                    Contacter le propriétaire
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    Sélectionnez une alerte rapide ou écrivez un message.
                  </div>
                </div>

                {/* Preset Quick Buttons */}
                <div className="d-flex flex-column gap-1 mb-2">
                  <div
                    className="p-2 border rounded bg-white"
                    style={{ fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💡 Feux allumés sur le parking
                  </div>
                  <div
                    className="p-2 border rounded bg-white"
                    style={{ fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🚗 Véhicule gênant le passage
                  </div>
                  <div
                    className="p-2 border rounded bg-white"
                    style={{ fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🪟 Fenêtre restée ouverte
                  </div>
                </div>

                <div className="phone-card p-2">
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                    MESSAGE LIBRE
                  </div>
                  <div className="text-dark mt-1" style={{ fontSize: '0.72rem', minHeight: '36px', color: '#495057' }}>
                    Bonjour, vos feux de croisement sont restés allumés...
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="phone-btn-primary" type="button">
                    Continuer vers localisation <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screen 03: Optional Location */}
          <div className="winni-screen-col">
            <div className="winni-screen-step">03 — LOCATION</div>
            <div className="winni-screen-label">100% Optional</div>
            <div className="winni-phone-frame">
              <div className="winni-phone-speaker"></div>
              <div className="winni-phone-screen">
                <div className="winni-phone-brand">WINNI</div>

                <div className="mb-2">
                  <span className="phone-tag">
                    <i className="bi bi-geo-alt"></i> Lieu indicatif
                  </span>
                  <div className="fw-bold" style={{ fontSize: '0.88rem' }}>
                    Partager le lieu où vous l'avez trouvé
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    Aide le propriétaire à repérer son bien.
                  </div>
                </div>

                {/* Map preview sketch */}
                <div
                  className="phone-card p-2 text-center"
                  style={{
                    background: '#edf2ee',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div className="bg-white p-2 rounded-circle shadow-sm mb-2 text-success">
                    <i className="bi bi-geo-alt-fill fs-5"></i>
                  </div>
                  <div className="fw-bold text-dark" style={{ fontSize: '0.72rem' }}>
                    Zone repérée par le navigateur
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                    Transmis une seule fois. Pas de suivi GPS continu.
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="phone-btn-primary" type="button" style={{ background: '#087f66' }}>
                    <i className="bi bi-send-fill me-1"></i> Partager cette position
                  </button>
                  <button className="phone-btn-outline" type="button">
                    Continuer sans localisation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screen 04: Notify */}
          <div className="winni-screen-col">
            <div className="winni-screen-step">04 — NOTIFY</div>
            <div className="winni-screen-label">Confirmation</div>
            <div className="winni-phone-frame">
              <div className="winni-phone-speaker"></div>
              <div className="winni-phone-screen text-center justify-content-center">
                <div className="winni-phone-brand">WINNI</div>

                <div className="my-auto py-3">
                  <div
                    className="d-inline-flex p-3 rounded-circle bg-success text-white mb-3"
                    style={{ background: '#087f66 !important' }}
                  >
                    <i className="bi bi-check-lg fs-3"></i>
                  </div>
                  <div className="fw-bold fs-6">Message transmis !</div>
                  <p className="text-muted small mt-2 px-2" style={{ fontSize: '0.72rem' }}>
                    Le propriétaire a reçu votre notification instantanément par canal sécurisé.
                  </p>
                  <div className="phone-card bg-light border text-start mt-3 p-2">
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                      RÉSUMÉ TRANSMIS
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.72rem' }}>
                      Alerte feux allumés + Position partagée
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="text-muted" style={{ fontSize: '0.68rem', marginBottom: '8px' }}>
                    Merci pour votre geste citoyen.
                  </div>
                  <button className="phone-btn-outline" type="button">
                    Fermer la page
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screen 05: Return */}
          <div className="winni-screen-col">
            <div className="winni-screen-step">05 — RETURN</div>
            <div className="winni-screen-label">Owner View</div>
            <div className="winni-phone-frame">
              <div className="winni-phone-speaker"></div>
              <div className="winni-phone-screen">
                <div className="winni-phone-brand">ESPACE PROPRIÉTAIRE</div>

                <div className="phone-card bg-dark text-white p-3 mb-2" style={{ background: '#111418 !important' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-danger" style={{ fontSize: '0.62rem' }}>
                      NOUVELLE ALERTE
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                      Il y a 2 min
                    </span>
                  </div>
                  <div className="fw-bold" style={{ fontSize: '0.8rem' }}>
                    Votre Voiture a été signalée
                  </div>
                  <div className="small text-light opacity-75 mt-1" style={{ fontSize: '0.7rem' }}>
                    « Bonjour, vos feux de croisement sont restés allumés sur le parking. »
                  </div>
                </div>

                <div className="phone-card">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-geo-alt-fill text-success"></i>
                    <strong style={{ fontSize: '0.72rem' }}>Position indiquée par le trouveur</strong>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    Près du Parking Sud · Précision ~15m
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="d-flex gap-2">
                    <button className="phone-btn-primary mt-0" type="button" style={{ background: '#087f66' }}>
                      Remercier le trouveur
                    </button>
                  </div>
                  <button className="phone-btn-outline" type="button">
                    Marquer comme résolu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-5 text-muted small">
          <i className="bi bi-phone me-1"></i> Screen sequence tested across iOS Safari, Android Chrome, and
          low-connectivity mobile environments.
        </div>
      </div>
    </section>
  );
}
