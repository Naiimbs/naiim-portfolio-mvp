import React from 'react';
import winniCarTagImg from '../../../assets/images/winni-car-tag-detail-hero.jpg';
import winniMotoTagImg from '../../../assets/images/winni-moto-tag.jpg';
import winniLuggageTagImg from '../../../assets/images/winni-luggage-tag.jpg';

export default function WinniPhysicalProduct() {
  const products = [
    {
      badge: 'PHOTO 03 · CAR',
      title: 'Car Vehicle Tag',
      image: winniCarTagImg,
      alt: 'PHOTO 03 — Car WINNI sticker attached to vehicle glass',
      desc: 'Sticker attached to rear window quarter panel or bodywork. Designed to withstand weather, high-pressure car washes, and UV exposure.',
      specs: [
        { icon: 'bi-shield-check', text: '100% Waterproof vinyl' },
        { icon: 'bi-sun', text: 'Anti-UV protective lamination' },
        { icon: 'bi-check2', text: 'Zero adhesive residue on removal' },
      ],
    },
    {
      badge: 'PHOTO 04 · MOTORCYCLE',
      title: 'Motorcycle Frame Cut',
      image: winniMotoTagImg,
      alt: 'PHOTO 04 — Motorcycle WINNI sticker on metal chassis',
      desc: 'Sticker applied to durable metal chassis or tank. High contrast typography and QR density optimized for immediate smartphone lens focus.',
      specs: [
        { icon: 'bi-shield-check', text: 'High chemical resistance (petrol/grease)' },
        { icon: 'bi-lightning-charge', text: 'Instant scan from 1.5m distance' },
        { icon: 'bi-check2', text: 'Discreet industrial monochrome cut' },
      ],
    },
    {
      badge: 'PHOTO 05 · LUGGAGE',
      title: 'Travel Tag & Badge',
      image: winniLuggageTagImg,
      alt: 'PHOTO 05 — Premium luggage tag with WINNI identifier in airport',
      desc: 'Attached to hard-shell suitcases or bags in travel environments. Replaces vulnerable paper luggage tags with an indestructible digital link.',
      specs: [
        { icon: 'bi-shield-check', text: 'Flexible strap & rigid shell' },
        { icon: 'bi-globe', text: 'International airport baggage proof' },
        { icon: 'bi-check2', text: 'Multilingual scan interface' },
      ],
    },
  ];

  return (
    <section className="winni-section" id="physical-product">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">08 · PHYSICAL PRODUCT</span>
          <h2 className="winni-section-title">The interface doesn't end on the screen.</h2>
          <p className="winni-copy-lg">
            WINNI exists on the actual object. This tactile existence strongly differentiates the product from a
            conventional SaaS utility.
          </p>
        </div>

        <div className="row g-4">
          {products.map((item, idx) => (
            <div className="col-lg-4" key={idx}>
              <div className="winni-physical-card">
                <div className="card-img-wrap">
                  <img src={item.image} alt={item.alt} loading="lazy" />
                </div>
                <div className="card-body-content">
                  <span className="phone-tag active">{item.badge}</span>
                  <h4 className="fw-bold mt-1">{item.title}</h4>
                  <p className="text-muted small">{item.desc}</p>
                  <ul className="winni-spec-list mt-auto">
                    {item.specs.map((spec, sIdx) => (
                      <li key={sIdx}>
                        <i className={`bi ${spec.icon}`}></i> {spec.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <div className="p-3 bg-light rounded-3 border d-flex flex-wrap align-items-center justify-content-between text-muted small">
              <div>
                <i className="bi bi-printer me-2 text-dark"></i> <strong>Industrial Print Standards:</strong> 300 DPI
                CMYK, polymer technical vinyl, non-conductive inks.
              </div>
              <div className="mt-2 mt-md-0">
                <span className="badge bg-white text-dark border">
                  Cut formats: Large (70x35mm) · Compact (50x25mm) · Wide (90x30mm)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
