import React from 'react';
import Timeline from './Timeline';
import AboutCard from './AboutCard';

export default function AboutSection() {
  return (
    <section className="section-pad pt-2" id="about">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <div className="eyebrow">
              <span></span> THE JOURNEY
            </div>
            <h2>
              From making things with my hands<br />
              to building intelligent products.
            </h2>

            <Timeline />
          </div>

          <div className="col-lg-5">
            <AboutCard />
          </div>
        </div>
      </div>
    </section>
  );
}
