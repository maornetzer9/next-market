const { User } = require("../models/user");
const { toSafeUser } = require('../utils/userView');

const ADMIN_USER_FIELDS = ['_id', 'role', 'firstName', 'lastName', 'username', 'orders', 'checked', 'createAt'];

const loadUsersOrders = async (req) => {
    try
    {
        const users = await User.find({}).select(ADMIN_USER_FIELDS.join(' '));

        if( !users ) return { code: 404, message: 'Users not found' };

        return {
            code: 200,
            users: users.map((user) => toSafeUser(user, { fields: ADMIN_USER_FIELDS })),
        };
    }
    catch(err)
    {
        console.error('Internal Server Error', err.message);
        return { code: 500, message: 'Internal server error' };
    }
};


module.exports = { loadUsersOrders };
