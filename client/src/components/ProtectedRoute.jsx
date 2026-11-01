import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authAction } from '../actions/userActions';
import { ORIGIN } from '../App';
import { isAuthenticatedUser } from '../utils/auth';
import { getStoredAuthToken } from '../routes/auth';

const ProtectedRoute = ({ allowedRoles, redirectTo = '/login' }) => {
    const AUTH_URL = `${ORIGIN}/user/auth`;
    const reduxUser = useSelector((state) => state.userReducer.user);
    const token = getStoredAuthToken();
    const hasAllowedSession = Boolean(
        token &&
        isAuthenticatedUser(reduxUser) &&
        allowedRoles.includes(reduxUser.role)
    );

    const dispatch = useDispatch();
    const location = useLocation();
    const [loading, setLoading] = useState(!hasAllowedSession);
    const [isAuthorize, setIsAuthorize] = useState(hasAllowedSession);

    useEffect(() => {
        if (!token)
        {
            setLoading(false);
            setIsAuthorize(false);
            return;
        }

        const handleAuthentication = async () => {
            try
            {
                const { isAuth, user } = await dispatch(authAction(token, AUTH_URL));

                if (isAuth && allowedRoles.includes(user.role))
                {
                    setIsAuthorize(true);
                }
                else
                {
                    setIsAuthorize(false);
                }
            }
            catch(error)
            {
                console.error('Authentication failed:', error);
                setIsAuthorize(false);
            }
            finally
            {
                setLoading(false);
            }
        };

        handleAuthentication();
    }, [token, dispatch, allowedRoles]);

    if (loading) return null;

    return isAuthorize
      ? <Outlet />
      : <Navigate to={redirectTo} state={{ from: location }} replace />;

};

export default ProtectedRoute;
