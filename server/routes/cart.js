const express = require('express');
const cartController = require('../controllers/cart');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.post('/',         cartController.loadCartHandler       );
router.post('/add',      cartController.addToCartHandler      );
router.delete('/remove', cartController.removeFromCartHandler );
router.delete('/delete', cartController.deleteFromCartHandler );

module.exports = { cartRouter: router };
