import React from 'react';
import winniObjectFamilyImg from '../../../assets/images/winni-object-family.webp';
import { resolveAsset } from '../../../services/assetRegistry';
import { parseCaseStudyArray } from '../../../utils/caseStudyContent';

const DEFAULT_BULLETS = [
  { title: 'A phone number', text: 'can be unsafe and invasive to publish openly on an object.' },
  { title: 'A name alone', text: 'is not enough to create an actionable communication link.' },
  { title: 'A traditional label', text: 'can label an object, but cannot create a safe, dynamic way to reconnect.' },
];
const DEFAULT_OBJECT_CARDS = [
  { icon: 'bi-car-front', title: 'Car', desc: 'Vehicle windshield & panel tag' },
  { icon: 'bi-bicycle', title: 'Motorcycle', desc: 'Durable chassis & tank cut' },
  { icon: 'bi-suitcase', title: 'Luggage', desc: 'Waterproof travel tag' },
];

export default function WinniProblem({ content = {} }) {
  const bullets = parseCaseStudyArray(content.bulletsJson, DEFAULT_BULLETS)
    .filter((item) => item && typeof item === 'object');
  const objectCards = parseCaseStudyArray(content.objectCardsJson, DEFAULT_OBJECT_CARDS)
    .filter((item) => item && typeof item === 'object');
  const image = resolveAsset(content.image) || winniObjectFamilyImg;

  return (
    <section className="winni-section" id="problem">
      <div className="container">
        <div className="row align-items-start g-5">
          <div className="col-lg-6">
            <span className="winni-section-num">{content.eyebrow || '02 · THE PROBLEM'}</span>
            <h2 className="winni-section-title">{content.title || 'When something gets lost, the object loses its connection to its owner.'}</h2>
            <p className="winni-copy">{content.lead || 'Most physical belongings have no practical way to identify their owner without exposing private information.'}</p>
            <ul className="case-list mt-3 mb-4">
              {bullets.map((item, idx) => (
                <li key={idx}><strong>{item.title || ''}</strong> {item.text || ''}</li>
              ))}
            </ul>
            <div className="winni-pullquote">{content.quote || '“What if every physical object could have a digital identity?”'}</div>
          </div>
          <div className="col-lg-6">
            <figure className="winni-hero-figure mb-3">
              <img src={image} alt={content.imageAlt || 'Car, motorcycle, and travel luggage representing everyday belongings'} loading="lazy" decoding="async" />
            </figure>
            <div className="row g-3">
              {objectCards.map((card, idx) => (
                <div className="col-4" key={idx}>
                  <div className="winni-object-card text-center p-3">
                    <div className="icon-wrap mx-auto"><i className={`bi ${card.icon || 'bi-box'}`}></i></div>
                    <h4 className="fs-6 mb-1">{card.title || ''}</h4>
                    <p className="small text-muted">{card.desc || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
