import React from 'react';
import '../../css/admin-metric-card.css';

export default function AdminMetricCard({
  tone,
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <article className={`admin-metric-card admin-metric-card--${tone}`}>
      <span className="admin-metric-card__icon" aria-hidden="true">
        <Icon fontSize="inherit" />
      </span>
      <div className="admin-metric-card__copy">
        <p className="admin-metric-card__label">{label}</p>
        <p className="admin-metric-card__value">{value}</p>
        {detail ? <p className="admin-metric-card__detail">{detail}</p> : null}
      </div>
      <span className="admin-metric-card__signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </article>
  );
}
