import React from 'react';

export default function WinniIdea() {
  return (
    <section className="winni-section alt-bg" id="idea">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">03 · THE IDEA</span>
          <h2 className="winni-section-title">Give your things a way back.</h2>
          <p className="winni-copy-lg">
            WINNI connects a physical object to a private digital identity. A finder doesn't need to download an
            application or create an account. They simply scan the WINNI tag.
          </p>
        </div>

        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-5">
            <h3 className="fs-4 fw-bold mb-3">The return is the story.</h3>
            <p className="winni-copy">
              Technology is not the narrative—the safe return of the belongings is the narrative. WINNI establishes a
              direct, frictionless bridge between the physical world and a private cloud channel.
            </p>
            <div className="p-4 bg-white rounded-3 border mt-3">
              <div className="small fw-bold text-uppercase text-muted mb-2 tracking-wide">Core Recovery Journey</div>
              <div className="d-flex flex-wrap align-items-center gap-2 fw-bold text-dark font-monospace small">
                <span className="badge bg-dark text-white px-2 py-1">SCAN</span>
                <i className="bi bi-arrow-right text-muted"></i>
                <span className="badge bg-light text-dark border px-2 py-1">REACH</span>
                <i className="bi bi-arrow-right text-muted"></i>
                <span className="badge bg-light text-dark border px-2 py-1">OPTIONAL LOCATION</span>
                <i className="bi bi-arrow-right text-muted"></i>
                <span className="badge bg-light text-dark border px-2 py-1">NOTIFY</span>
                <i className="bi bi-arrow-right text-muted"></i>
                <span className="badge bg-success text-white px-2 py-1">RETURN</span>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            {/* ASSET 03: SVG Illustration Sequence (Inline for instant, verified rendering) */}
            <div className="bg-white p-3 p-md-4 rounded-4 border shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1080 340"
                width="100%"
                height="auto"
                className="d-block"
                fill="none"
              >
                <rect x="2" y="2" width="1076" height="336" rx="16" fill="#fcfdfa" stroke="#e3e8e5" strokeWidth="1" />

                {/* Upper Row: 4 Main Touchpoints */}
                {/* 01: Physical Object */}
                <g transform="translate(40, 36)">
                  <rect width="210" height="130" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
                  <text
                    x="24"
                    y="34"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="#087f66"
                    letterSpacing="0.08em"
                  >
                    01 · PHYSICAL
                  </text>
                  <path
                    d="M 24 64 L 32 50 L 52 50 L 58 64 Z M 22 64 L 60 64 L 62 76 L 20 76 Z"
                    stroke="#111418"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="28" cy="76" r="3.5" stroke="#111418" strokeWidth="1.75" />
                  <circle cx="54" cy="76" r="3.5" stroke="#111418" strokeWidth="1.75" />
                  <text
                    x="76"
                    y="62"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill="#111418"
                  >
                    Physical Object
                  </text>
                  <text x="76" y="80" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Car, Moto, Luggage
                  </text>
                  <text x="24" y="112" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Lost in real-world context
                  </text>
                </g>

                {/* Arrow 1 -> 2 */}
                <g transform="translate(262, 101)">
                  <line
                    x1="0"
                    y1="0"
                    x2="26"
                    y2="0"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="21,-4 26,0 21,4"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>

                {/* 02: WINNI Tag */}
                <g transform="translate(300, 36)">
                  <rect width="210" height="130" rx="12" fill="#111418" stroke="#111418" strokeWidth="1.25" />
                  <text
                    x="24"
                    y="34"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="#65d6b4"
                    letterSpacing="0.08em"
                  >
                    02 · IDENTITY
                  </text>
                  <rect
                    x="24"
                    y="50"
                    width="28"
                    height="28"
                    rx="4"
                    stroke="#ffffff"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <rect x="28" y="54" width="7" height="7" fill="#ffffff" />
                  <rect x="41" y="54" width="7" height="7" fill="#ffffff" />
                  <rect x="28" y="67" width="7" height="7" fill="#ffffff" />
                  <rect x="41" y="67" width="3" height="3" fill="#ffffff" />
                  <text
                    x="64"
                    y="62"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    WINNI Tag
                  </text>
                  <text x="64" y="80" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#b8c0c4">
                    Durable QR / NFC
                  </text>
                  <text x="24" y="112" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#b8c0c4">
                    Attached to object body
                  </text>
                </g>

                {/* Arrow 2 -> 3 */}
                <g transform="translate(522, 101)">
                  <line
                    x1="0"
                    y1="0"
                    x2="26"
                    y2="0"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="21,-4 26,0 21,4"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>

                {/* 03: Finder Phone */}
                <g transform="translate(560, 36)">
                  <rect width="210" height="130" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
                  <text
                    x="24"
                    y="34"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="#087f66"
                    letterSpacing="0.08em"
                  >
                    03 · FINDER
                  </text>
                  <rect
                    x="24"
                    y="50"
                    width="20"
                    height="32"
                    rx="3"
                    stroke="#111418"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <line
                    x1="31"
                    y1="76"
                    x2="37"
                    y2="76"
                    stroke="#111418"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <text
                    x="56"
                    y="62"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill="#111418"
                  >
                    Finder Phone
                  </text>
                  <text x="56" y="80" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Zero app install
                  </text>
                  <text x="24" y="112" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Scans tag, reaches owner
                  </text>
                </g>

                {/* Arrow 3 -> 4 */}
                <g transform="translate(782, 101)">
                  <line
                    x1="0"
                    y1="0"
                    x2="26"
                    y2="0"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="21,-4 26,0 21,4"
                    stroke="#99a7a2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>

                {/* 04: Owner */}
                <g transform="translate(820, 36)">
                  <rect width="220" height="130" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
                  <text
                    x="24"
                    y="34"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="#087f66"
                    letterSpacing="0.08em"
                  >
                    04 · RECOVERY
                  </text>
                  <path
                    d="M 24 53 L 36 49 L 48 53 C 48 68 36 78 36 78 C 36 78 24 68 24 53 Z"
                    stroke="#111418"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <polyline
                    points="31,63 35,67 42,59"
                    stroke="#111418"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <text
                    x="60"
                    y="62"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill="#111418"
                  >
                    Owner Notified
                  </text>
                  <text x="60" y="80" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Private &amp; Instant
                  </text>
                  <text x="24" y="112" fontFamily="'DM Sans', sans-serif" fontSize="12" fill="#718187">
                    Receives alert + returns
                  </text>
                </g>

                {/* Divider Line */}
                <line
                  x1="40"
                  y1="195"
                  x2="1040"
                  y2="195"
                  stroke="#e8ecea"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Lower Row: The 5-Step Journey */}
                <text
                  x="40"
                  y="235"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize="11"
                  fontWeight="700"
                  fill="#718187"
                  letterSpacing="0.12em"
                >
                  CORE RECOVERY JOURNEY
                </text>

                {/* Step 1: SCAN */}
                <g transform="translate(40, 255)">
                  <rect width="170" height="48" rx="20" fill="#f2f5f3" stroke="#dfe5e1" strokeWidth="1" />
                  <text x="18" y="29" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill="#087f66">
                    01
                  </text>
                  <text
                    x="44"
                    y="29"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#24353a"
                    letterSpacing="0.05em"
                  >
                    SCAN
                  </text>
                  <text x="96" y="29" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#718187">
                    No account
                  </text>
                </g>

                {/* Arrow */}
                <g transform="translate(218, 279)">
                  <line x1="0" y1="0" x2="14" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="10,-3 14,0 10,3" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>

                {/* Step 2: REACH */}
                <g transform="translate(240, 255)">
                  <rect width="170" height="48" rx="20" fill="#f2f5f3" stroke="#dfe5e1" strokeWidth="1" />
                  <text x="18" y="29" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill="#087f66">
                    02
                  </text>
                  <text
                    x="44"
                    y="29"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#24353a"
                    letterSpacing="0.05em"
                  >
                    REACH
                  </text>
                  <text x="100" y="29" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#718187">
                    Private msg
                  </text>
                </g>

                {/* Arrow */}
                <g transform="translate(418, 279)">
                  <line x1="0" y1="0" x2="14" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="10,-3 14,0 10,3" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>

                {/* Step 3: OPTIONAL LOCATION */}
                <g transform="translate(440, 255)">
                  <rect width="215" height="48" rx="20" fill="#f2f5f3" stroke="#dfe5e1" strokeWidth="1" />
                  <text x="18" y="29" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill="#087f66">
                    03
                  </text>
                  <text
                    x="44"
                    y="29"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#24353a"
                    letterSpacing="0.05em"
                  >
                    LOCATION
                  </text>
                  <text x="122" y="29" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#718187">
                    100% Optional
                  </text>
                </g>

                {/* Arrow */}
                <g transform="translate(663, 279)">
                  <line x1="0" y1="0" x2="14" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="10,-3 14,0 10,3" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>

                {/* Step 4: NOTIFY */}
                <g transform="translate(685, 255)">
                  <rect width="165" height="48" rx="20" fill="#f2f5f3" stroke="#dfe5e1" strokeWidth="1" />
                  <text x="18" y="29" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill="#087f66">
                    04
                  </text>
                  <text
                    x="44"
                    y="29"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#24353a"
                    letterSpacing="0.05em"
                  >
                    NOTIFY
                  </text>
                  <text x="106" y="29" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#718187">
                    Owner alert
                  </text>
                </g>

                {/* Arrow */}
                <g transform="translate(858, 279)">
                  <line x1="0" y1="0" x2="14" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="10,-3 14,0 10,3" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>

                {/* Step 5: RETURN */}
                <g transform="translate(880, 255)">
                  <rect width="160" height="48" rx="20" fill="#e7f3ef" stroke="#b5dcce" strokeWidth="1" />
                  <text x="18" y="29" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill="#087f66">
                    05
                  </text>
                  <text
                    x="44"
                    y="29"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#075b4b"
                    letterSpacing="0.05em"
                  >
                    RETURN
                  </text>
                  <text x="110" y="29" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#087f66">
                    Solved
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
