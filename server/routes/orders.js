const express = require('express');
const ordersController = require('../controllers/orders');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/',     ordersController.loadOrdersHandler );
router.post('/add', ordersController.newOrderHandler   );

module.exports = {  ordersRouter: router };
