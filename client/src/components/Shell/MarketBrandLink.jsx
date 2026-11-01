import React from 'react';
import { Link } from 'react-router-dom';
import BrandWordmark from './BrandWordmark';

export default function MarketBrandLink({ to, ariaLabel = 'NEXT MARKET home' }) {
  return (
    <Link to={to} className="b25-customer-command__brand" aria-label={ariaLabel}>
      <BrandWordmark />
    </Link>
  );
}
