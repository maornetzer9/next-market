
const express = require('express');
const productsController = require('../controllers/products');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/',          productsController.loadProductsHandler     );
router.get('/admin',     requireAdmin, productsController.loadAdminProductsHandler );
router.use(requireAdmin);
router.put('/modify',    productsController.modifyProductHandler    );
router.put('/update',    productsController.updateCategoriesHandler );
router.post('/create',   productsController.createCategoriesHandler );
router.delete('/delete', productsController.deleteCategoriesHandler );

module.exports = { productsRouter: router };
