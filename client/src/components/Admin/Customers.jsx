import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadUsersOrders } from '../../actions/orderActions';
import { useDarkMode } from '../../hooks/darkMode';
import { ORIGIN } from '../../App';
import AdminPageContainer from './AdminPageContainer';
import AdminPageHeader from './AdminPageHeader';
import AdminCustomersTable from './AdminCustomersTable';
import '../../css/admin-customers.css';

/**
 * Admin Customers — view-only list + orders detail panel.
 * Data: GET /admin/user via loadUsersOrders (unchanged).
 */
export default function Customers() {
  const LOAD_ADMIN_ORDERS_URL = `${ORIGIN}/admin/user`;
  const dispatch = useDispatch();
  const [loadState, setLoadState] = useState({ loading: true, error: null });
  useDarkMode();

  useEffect(() => {
    let active = true;
    const fetchUsersOrders = async () => {
      try {
        const response = await dispatch(loadUsersOrders(LOAD_ADMIN_ORDERS_URL));
        if (!active) return;
        if (response?.code === 200) {
          setLoadState({ loading: false, error: null });
        } else {
          setLoadState({ loading: false, error: response?.message || 'Please try again later.' });
        }
      } catch (error) {
        console.error(
          'Failed To Load Users Orders On Admin Panel',
          error.message
        );
        if (active) setLoadState({ loading: false, error: 'Please try again later.' });
      }
    };
    fetchUsersOrders();
    return () => { active = false; };
    // Same load-once behavior as prior Customers.jsx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminPageContainer className="admin-customers">
      <AdminPageHeader
        title="Customers"
        description="View your customers and their orders."
      />

      <div className="admin-page__body">
        <AdminCustomersTable loading={loadState.loading} loadError={loadState.error} />
      </div>
    </AdminPageContainer>
  );
}
