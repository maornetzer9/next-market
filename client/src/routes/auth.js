export const getStoredAuthToken = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    return typeof storedUser?.token === 'string' ? storedUser.token : '';
  } catch {
    return '';
  }
};

export const withAuth = (config = {}) => {
  const token = getStoredAuthToken();
  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};
