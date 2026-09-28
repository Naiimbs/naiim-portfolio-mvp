import React from 'react';

export default function ContactSection() {
  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-box">
          <div>
            <div className="eyebrow light">
              <span></span> LET'S CONNECT
            </div>
            <h2>
              Have an idea, a product<br />
              or a problem to solve?
            </h2>
            <p>Let's turn it into something real.</p>
          </div>
          <a className="btn btn-warning rounded-pill px-4" href="mailto:hi@naiimbsili.com">
            Let's talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
