import React from 'react';

/**
 * Consistent content width / spacing inside the Admin shell outlet.
 */
export default function AdminPageContainer({ children, className = '' }) {
  const classes = ['admin-page', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
