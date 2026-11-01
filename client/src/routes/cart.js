import axios from "axios"
import { withAuth } from './auth';

export const handleLoadCart = async ( userId, CART_URL_LOAD ) => {
    try
    {
        const { data } = await axios.post(CART_URL_LOAD, {}, withAuth());
        return data;
    }
    catch(err)
    {
        console.error(' Failed to load cart:', err.message);
        throw new Error(' Failed to load cart ');
    }
};


export const handleAddToCart = async ( userId, product, url, quantity ) => {
    try
    {
        const payload = { product };
        if (Number.isFinite(Number(quantity))) payload.quantity = Math.floor(Number(quantity));
        const { data } = await axios.post(url, payload, withAuth());
        return data
    }
    catch(err)
    {
        console.error(' Failed to add new product to the cart: ', err.message);
        throw new Error(' Failed to add new product to the cart ');
    }
};


export const handleRemoveFromCart = async ( userId, product, url ) => {
    try
    {
        const { data } = await axios.delete(url, withAuth({ data: { product } }));
        return data
    }
    catch(err)
    {
        console.error(' Failed to add new product to the cart: ', err.message);
        throw new Error(' Failed to add new product to the cart ');
    }
};


export const handleDeleteFromCart = async ( id, _id, url ) => {
    try
    {
        const { data } = await axios.delete(url, withAuth({ data: { id } }));
        return data
    }
    catch(err)
    {
        console.error(' Failed To Delete From Cart: ', err.message);
        throw new Error(' Failed To Delete From Cart: ');
    }
};
