const SAFE_USER_FIELDS = [
  '_id',
  'role',
  'firstName',
  'lastName',
  'username',
  'cart',
  'orders',
  'isAuth',
  'checked',
  'createAt',
];

const toPlainObject = (user) => {
  if (!user) return null;
  if (typeof user.toObject === 'function') return user.toObject();
  return { ...user };
};

const toSafeUser = (user, { includeToken = false, fields = SAFE_USER_FIELDS } = {}) => {
  const source = toPlainObject(user);
  if (!source) return null;

  const safe = {};
  for (const field of fields) {
    if (source[field] !== undefined) safe[field] = source[field];
  }
  if (includeToken && typeof source.token === 'string') safe.token = source.token;
  return safe;
};

module.exports = { SAFE_USER_FIELDS, toSafeUser };
