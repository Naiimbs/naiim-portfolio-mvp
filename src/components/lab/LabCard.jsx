import React from 'react';

export default function LabCard({ icon, title, description }) {
  return (
    <div className="lab-card">
      <i className={`bi ${icon}`}></i>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
