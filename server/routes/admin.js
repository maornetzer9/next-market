const express = require('express');
const adminController = require('../controllers/admin');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/user', adminController.loadUsersOrdersHandler );

module.exports = { adminRouter: router };
