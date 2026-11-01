export function isAuthenticatedUser(user) {
  return Boolean(user?._id && user?.token);
}
