import React from 'react';

export default function WinniSystemMatrix() {
  const matrixRows = [
    {
      num: '01 · Identification',
      physical: 'Durable vinyl sticker with matte black finish and high-contrast QR mark.',
      digital: 'Direct URL resolution to /scan/:winniId without app store redirects.',
      code: true,
    },
    {
      num: '02 · Interaction',
      physical: 'Camera optical scan or NFC tap directly from physical surface.',
      digital: 'Lightweight mobile landing page recognizing object category and status.',
      code: false,
    },
    {
      num: '03 · Communication',
      physical: 'Zero on-object contact details (no printed phone number or personal address).',
      digital: 'Anonymous message proxy routing through secure notification backend.',
      code: false,
    },
    {
      num: '04 · Context',
      physical: 'Object location in physical space (parking spot, train, airport terminal).',
      digital: 'Optional single-shot geocoordinates with map preview for owner context.',
      code: false,
    },
    {
      num: '05 · Resolution',
      physical: 'Physical hand-off or owner retrieval of belongings.',
      digital: 'Status transition to "Object Recovered", archive interaction safely.',
      code: false,
    },
  ];

  return (
    <section className="winni-section alt-bg" id="system-touchpoints">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">09 · UNIFIED SYSTEM</span>
          <h2 className="winni-section-title">One identity. Multiple touchpoints.</h2>
          <p className="winni-copy-lg">
            A cohesive visual and logical architecture spanning physical stickers, mobile web browsers, and
            administrative controls.
          </p>
        </div>

        <div className="winni-matrix-wrap shadow-sm">
          <table className="winni-matrix-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>TOUCHPOINT</th>
                <th style={{ width: '35%' }}>PHYSICAL ARTIFACT</th>
                <th style={{ width: '40%' }}>DIGITAL LAYER</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{row.num}</strong>
                  </td>
                  <td>{row.physical}</td>
                  <td>
                    {row.code ? (
                      <>
                        Direct URL resolution to <code>/scan/:winniId</code> without app store redirects.
                      </>
                    ) : (
                      row.digital
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
