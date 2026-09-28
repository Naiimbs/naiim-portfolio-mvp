import React from 'react';
import { projects } from '../../data/projects';
import ProjectCard from './ProjectCard';
import MiniProjectCard from './MiniProjectCard';

export default function SelectedWorkSection() {
  const featuredProjects = projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);
  const miniProjects = projects.filter((p) => !p.featured).sort((a, b) => a.order - b.order);

  return (
    <section className="section-pad pt-5" id="work">
      <div className="container">
        <div className="section-heading d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="eyebrow">
              <span></span> SELECTED WORK
            </div>
            <h2>Products, systems & digital experiences</h2>
            <p>
              From startup products and AI systems to Saudi digital services and front-end implementation.
            </p>
          </div>
          <a href="#contact" className="text-link d-none d-md-inline">
            Let's talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>

        <div className="row g-4">
          {featuredProjects.map((project) => (
            <div className="col-lg-4" key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        <div className="row g-3 mt-1">
          {miniProjects.map((project) => (
            <div className="col-md-6 col-lg-3" key={project.id}>
              <MiniProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
