import React from 'react';

/** Presentation-only frame; the live Orders UI owns its own content and scrolling. */
export default function AdminDeviceFrame({ children }) {
  return (
    <div className="admin-device-frame">
      <div className="admin-device-frame__screen">
        <div className="admin-device-frame__hardware" aria-hidden="true">
          <span className="admin-device-frame__island" />
        </div>
        <div className="admin-device-frame__viewport">{children}</div>
        <span className="admin-device-frame__home" aria-hidden="true" />
      </div>
    </div>
  );
}
