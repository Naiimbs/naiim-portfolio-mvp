import React from 'react';
import winniObjectFamilyImg from '../../../assets/images/winni-object-family.jpg';

export default function WinniProblem() {
  const objectCards = [
    {
      icon: 'bi-car-front',
      title: 'Car',
      desc: 'Vehicle windshield & panel tag',
    },
    {
      icon: 'bi-bicycle',
      title: 'Motorcycle',
      desc: 'Durable chassis & tank cut',
    },
    {
      icon: 'bi-suitcase',
      title: 'Luggage',
      desc: 'Waterproof travel tag',
    },
  ];

  return (
    <section className="winni-section" id="problem">
      <div className="container">
        <div className="row align-items-start g-5">
          <div className="col-lg-6">
            <span className="winni-section-num">02 · THE PROBLEM</span>
            <h2 className="winni-section-title">
              When something gets lost, the object loses its connection to its owner.
            </h2>
            <p className="winni-copy">
              Most physical belongings have no practical way to identify their owner without exposing private
              information.
            </p>
            <ul className="case-list mt-3 mb-4">
              <li>
                <strong>A phone number</strong> can be unsafe and invasive to publish openly on an object.
              </li>
              <li>
                <strong>A name alone</strong> is not enough to create an actionable communication link.
              </li>
              <li>
                <strong>A traditional label</strong> can label an object, but cannot create a safe, dynamic way to
                reconnect.
              </li>
            </ul>
            <div className="winni-pullquote">
              “What if every physical object could have a digital identity?”
            </div>
          </div>
          <div className="col-lg-6">
            {/* PHOTO 02 — Object family: Car, Motorcycle, Luggage */}
            <figure className="winni-hero-figure mb-3">
              <img
                src={winniObjectFamilyImg}
                alt="Wide editorial photograph combining a car, motorcycle, and travel luggage on clean pavement"
                loading="lazy"
              />
            </figure>
            <div className="row g-3">
              {objectCards.map((card, idx) => (
                <div className="col-4" key={idx}>
                  <div className="winni-object-card text-center p-3">
                    <div className="icon-wrap mx-auto">
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                    <h4 className="fs-6 mb-1">{card.title}</h4>
                    <p className="small text-muted">{card.desc}</p>
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
