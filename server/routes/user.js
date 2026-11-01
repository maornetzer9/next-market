const express = require('express');
const userController = require('../controllers/user');
const { authenticate } = require('../middleware/auth');
const { loginRateLimit } = require('../middleware/security');

const router = express.Router();

router.get('/auth',       authenticate, userController.authHandler       );
router.post('/login',     loginRateLimit, userController.loginHandler    );
router.post('/register',  userController.registerHandler   );
router.put('/update',     authenticate, userController.updateHandler     );
router.post('/disconnect', authenticate, userController.disconnectHandler );

module.exports = { userRouter: router };
