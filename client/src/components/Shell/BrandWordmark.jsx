import React from 'react';

/** The shared NEXT / MARKET text structure used by nav and page signatures. */
export default function BrandWordmark() {
  return (
    <>
      <span>NEXT</span>
      <span aria-hidden="true">/</span>
      <strong>MARKET</strong>
    </>
  );
}
