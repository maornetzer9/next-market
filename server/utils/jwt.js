const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const secretKey = process.env.SECRET_KEY;
const jwtUtils = {

    generateToken: function(payload, expiresIn = '24h')
    {
        const options = { expiresIn };
        return jwt.sign(payload, secretKey, options);
    },

    verifyToken: function(token)
    {
        try
        {
            if(!token) return { code: 401, message: 'Token not found' };
            return jwt.verify(token, secretKey);
        }
        catch(err)
        {
            return null;
        }

    }
}

module.exports = jwtUtils;
