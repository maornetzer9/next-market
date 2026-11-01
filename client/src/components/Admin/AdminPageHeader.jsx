import React from 'react';
import PageBrandSignature from '../Shell/PageBrandSignature';
import '../../css/page-heading.css';

/**
 * Shared Admin page header — Customer brand signature, title, description, optional actions.
 */
export default function AdminPageHeader({
  title,
  description,
  actions = null,
}) {
  return (
    <header className="admin-page__header">
      <div>
        <PageBrandSignature />
        <h1 className="admin-page__title">{title}</h1>
        {description ? (
          <p className="admin-page__description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="admin-page__actions">{actions}</div> : null}
    </header>
  );
}
