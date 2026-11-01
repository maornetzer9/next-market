import React from 'react';

const statusClassName = (status) =>
  String(status || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

export default function AdminStatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`admin-status-badge is-${statusClassName(status)}`}>
      {status}
    </span>
  );
}
