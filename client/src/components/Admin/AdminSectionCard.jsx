import React from 'react';

export default function AdminSectionCard({
  as: Component = 'section',
  className = '',
  icon: Icon,
  tone = 'orange',
  title,
  subtitle,
  action = null,
  children,
  ...props
}) {
  return (
    <Component
      className={['admin-section-card', className].filter(Boolean).join(' ')}
      {...props}
    >
      <header className="admin-section-card__header">
        <div className="admin-section-card__heading">
          {Icon ? (
            <span className={`admin-section-card__icon is-${tone}`} aria-hidden="true">
              <Icon fontSize="inherit" />
            </span>
          ) : null}
          <div className="admin-section-card__copy">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="admin-section-card__action">{action}</div> : null}
      </header>
      <div className="admin-section-card__body">{children}</div>
    </Component>
  );
}
