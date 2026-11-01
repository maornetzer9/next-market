const Products = require("../models/products");
const { User } = require("../models/user");


const loadCart = async (req) => {
    try
    {
        const user = await User.findById(req.auth.userId);
        if( !user ) return { code: 400, message: 'No cart found for this user' };

        return { code: 200, cart: user.cart };
    }
    catch(err)
    {
        console.error('Error loading cart: ', err.message);
        return { code: 500, message: 'Internal server error' };
    }

};

const addToCart = async (req) => {
    try
    {
        const { product, quantity } = req.body;
        const id = Number(product?.id);
        if (!Number.isInteger(id)) return { code: 400, message: 'Invalid product' };

        // Back-compat: legacy callers omit quantity and expect a +1 add.
        const parsedQuantity = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 1;
        if (parsedQuantity < 1) return { code: 400, message: 'Quantity must be at least 1' };

        const user = await User.findById(req.auth.userId);
        if (!user) return { code: 404, message: 'User not found' };

        const isProductsExists = await Products.findOne({ id });
        if (!isProductsExists) return { code: 404, message: 'Product not found' };
        if (isProductsExists.stock < 1) return { code: 400, message: 'Stock is not available' };

        const index = user.cart.items.findIndex((item) => item.id == id);
        const existingLineQuantity = index !== -1 ? Number(user.cart.items[index].quantity) || 0 : 0;
        const nextQuantity = existingLineQuantity + parsedQuantity;

        if (nextQuantity > isProductsExists.stock) return { code: 400, message: 'Stock is not available' };

        if (index !== -1)
        {
            user.cart.items[index].quantity = nextQuantity;
        }
        else
        {
            user.cart.items.push({
                id: isProductsExists.id,
                title: isProductsExists.title,
                description: isProductsExists.description,
                category: isProductsExists.category,
                price: isProductsExists.price,
                rating: isProductsExists.rating,
                stock: isProductsExists.stock,
                quantity: parsedQuantity,
                thumbnail: isProductsExists.thumbnail
            });
        }

        const total = user.cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        user.cart.total = total.toFixed(2);

        await user.save();

        const finalIndex = index !== -1 ? index : user.cart.items.length - 1;
        return {
            code: 200,
            newProduct: user.cart.items[finalIndex],
            total: user.cart.total,
            message: 'Added Successfully'
        };
    }
    catch(err)
    {
        console.error('Error Adding Product To Cart:', err.message);
        return { code: 500, message: 'Internal server error' };
    }
};

const removeFromCart = async (req) => {
    try
    {
        const { product } = req.body;
        const id = Number(product?.id);
        if (!Number.isInteger(id)) return { code: 400, message: 'Invalid product' };

        const user = await User.findById(req.auth.userId);
        if (!user) return { code: 404, message: 'User Not Found' };

        const index = user.cart.items.findIndex((item) => item.id == id);

        if (index !== -1)
        {
            if (user.cart.items[index].quantity > 1)
            {
                user.cart.items[index].quantity--;
            }
            else
            {
                user.cart.items.splice(index, 1);
            }

            const total = user.cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
            user.cart.total = total.toFixed(2);

            await user.save();

            const updatedCartItems = user.cart.items.map(item => {
                const { _id, ...rest } = item.toObject();
                return rest;
            });

            return { code: 200, updatedProduct: updatedCartItems, total: user.cart.total };
        }
        else
        {
            return { code: 400, message: 'Product Not Found In The Cart' };
        }
    }
    catch(err)
    {
        console.error('Error Decreasing Quantity:', err.message);
        return { code: 500, message: 'Internal server error' };
    }
};

const deleteFromCart = async (req) => {
    try
    {
        const id = Number(req.body?.id);
        if (!Number.isInteger(id)) return { code: 400, message: 'Invalid product' };

        const user = await User.findById(req.auth.userId)
        if( !user ) return { code: 400, message: 'User Not Found' };

        const userCartProduct = user.cart.items.find((item) => item.id === id);
        if( !userCartProduct ) return { code: 404, message: 'Product Not Found In Your Cart' }

        const filteredCart = user.cart.items.filter((item) => item.id !== userCartProduct.id);
        user.cart.items = filteredCart;

        const total = user.cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        user.cart.total = total.toFixed(2);

        await user.save();

        return { code: 200, cart: user.cart.items, total };
    }
    catch(err)
    {
        console.error('Error To Remove The Product From The Cart:', err.message);
        return { code: 500, message: 'Internal Server Error' };
    }
};

module.exports = { loadCart, addToCart, removeFromCart, deleteFromCart };
