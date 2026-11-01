const { User } = require('../models/user');
const { compareHash } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { toSafeUser } = require('../utils/userView');

const cleanString = (value, maxLength = 128) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const auth = async (req, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.auth.userId },
      { $set: { isAuth: true } },
      { new: true }
    );
    if (!user) return { code: 401, message: 'Invalid or expired session' };

    return {
      code: 200,
      user: toSafeUser(user, { includeToken: true }),
      isAuth: true,
    };
  } catch (error) {
    next(error);
  }
};

const login = async (req, next) => {
  try {
    const username = cleanString(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password || password.length > 256) {
      return { code: 400, message: 'Invalid username or password' };
    }

    const user = await User.findOne({ username });
    const passwordMatches = user ? await compareHash(password, user.password) : false;
    if (!user || !passwordMatches) return { code: 401, message: 'Invalid username or password' };

    const token = generateToken({ user: { _id: user._id } });
    user.token = token;
    user.isAuth = true;
    await user.save();

    return { code: 200, user: toSafeUser(user, { includeToken: true }), token };
  } catch (error) {
    next(error);
  }
};

const register = async (req, next) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    const normalized = {
      firstName: cleanString(firstName, 80),
      lastName: cleanString(lastName, 80),
      username: cleanString(username, 80),
      password: typeof password === 'string' ? password : '',
    };

    if (!normalized.firstName || !normalized.lastName || !normalized.username) {
      return { code: 400, message: 'All registration fields are required' };
    }
    if (normalized.password.length < 8 || normalized.password.length > 128) {
      return { code: 400, message: 'Password must be between 8 and 128 characters' };
    }

    const isUserExists = await User.findOne({ username: normalized.username });
    if (isUserExists) return { code: 409, message: 'Username already taken' };

    const user = await new User({
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      username: normalized.username,
      password: normalized.password,
    });
    await user.save();

    return { code: 200, user: toSafeUser(user) };
  } catch (error) {
    next(error);
  }
};

const update = async (req, next) => {
  try {
    const form = req.body?.form;
    if (!form || typeof form !== 'object' || Array.isArray(form)) {
      return { code: 400, message: 'Invalid account update' };
    }

    const { firstName, lastName, username, password, checked } = form;
    let updateFields = {
      firstName: cleanString(firstName, 80),
      lastName: cleanString(lastName, 80),
      username: cleanString(username, 80),
      checked: Boolean(checked),
    };

    if (!updateFields.firstName || !updateFields.lastName || !updateFields.username) {
      return { code: 400, message: 'Name and username are required' };
    }

    const isUsernameExists = await User.findOne({
      username: updateFields.username,
      _id: { $ne: req.auth.userId },
    });
    if (isUsernameExists) return { code: 409, message: 'Username Already Taken' };

    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return { code: 400, message: 'Password must be between 8 and 128 characters' };
      }
      updateFields.password = password;
    }

    const user = await User.findOneAndUpdate(
      { _id: req.auth.userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!user) return { code: 404, message: 'User Not Found' };

    return {
      code: 200,
      user: toSafeUser(user, { includeToken: true }),
      message: 'Customer Update Successfully',
    };
  } catch (error) {
    next(error);
  }
};

const disconnect = async (req, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.auth.userId, token: req.auth.token },
      { $set: { isAuth: false, token: null } },
      { new: true }
    );
    if (!user) return { code: 401, message: 'Invalid or expired session' };
    return { code: 200, message: 'User logged out successfully' };
  } catch (error) {
    next(error);
  }
};

module.exports = { auth, login, register, update, disconnect };
