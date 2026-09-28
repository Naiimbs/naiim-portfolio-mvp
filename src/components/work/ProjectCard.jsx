import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const { card, heroImage, heroImageAlt, slug } = project;

  return (
    <article className="project-card">
      <div className="project-image">
        <img src={heroImage} alt={heroImageAlt || card.title} />
        <span className="project-badge">{card.badge}</span>
      </div>
      <div className="project-body">
        <div className="project-title-row">
          <div>
            <span className="project-kicker">{card.kicker}</span>
            <h3>{card.title}</h3>
          </div>
          {card.logoMark && (
            <span className={`logo-mark ${card.logoMark.className || ''}`}>
              {card.logoMark.letter}
            </span>
          )}
        </div>
        <p>{card.description}</p>
        <div className="tag-row">
          {card.tags && card.tags.map((tag, index) => (
            <span key={index}>{tag}</span>
          ))}
        </div>
        <Link className="card-link" to={`/work/${slug}`}>
          Read case study <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </article>
  );
}
