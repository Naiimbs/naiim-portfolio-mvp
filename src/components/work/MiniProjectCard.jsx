import React from 'react';
import { Link } from 'react-router-dom';

export default function MiniProjectCard({ project }) {
  const { card, slug } = project;

  return (
    <Link className="mini-project-card" to={`/work/${slug}`}>
      <span>{card.badge}</span>
      <b>{card.title}</b>
      <small>{card.subtitle}</small>
      <i className="bi bi-arrow-up-right"></i>
    </Link>
  );
}
