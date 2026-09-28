import React from 'react';

const TIMELINE_STEPS = [
  {
    step: '01',
    title: 'Mechanical design',
    subtitle: '& fabrication',
    small: null,
    active: false,
  },
  {
    step: '02',
    title: 'Industrial environments',
    subtitle: null,
    small: 'Process & maintenance · chlorine industry',
    active: false,
  },
  {
    step: '03',
    title: 'Plastic injection',
    subtitle: null,
    small: 'Moulding & manufacturing',
    active: false,
  },
  {
    step: '04',
    title: 'Digital design',
    subtitle: '& UX/UI',
    small: null,
    active: false,
  },
  {
    step: 'NOW',
    title: 'Product Design',
    subtitle: '& AI Product Building',
    small: null,
    active: true,
  },
];

export default function Timeline() {
  return (
    <div className="timeline mt-5">
      {TIMELINE_STEPS.map((item, index) => (
        <div className={`timeline-item ${item.active ? 'active' : ''}`} key={index}>
          <b>{item.step}</b>
          <span>
            {item.title}
            {item.subtitle && (
              <>
                <br />
                {item.subtitle}
              </>
            )}
            {item.small && (
              <>
                <br />
                <small>{item.small}</small>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
