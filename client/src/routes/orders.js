import axios from "axios"
import { withAuth } from './auth';

// Customer Http Request
export const handleLoadOrders = async ( _id, url, options = {} ) => {
    const { data } = await axios.get(url, withAuth({
        signal: options.signal,
    }));
    return data;
};


export const handleNewOrder = async ( id, url, idempotencyKey ) => {
    try
    {
        const { data } = await axios.post(url, {}, withAuth({
            headers: { 'Idempotency-Key': idempotencyKey },
        }));
        return data;
    }
    catch(error)
    {
        const message = error.response?.data?.message || error.message;
        console.error('Request Failed To Add New Order', message);
        return { code: error.response?.data?.code ?? 500, message };
    }
};

// Admin Http Request
export const handleLoadUsersOrders = async ( url ) => {
    try
    {
        const { data } = await axios.get(url, withAuth());
        return data;
    }
    catch(error)
    {
        console.error('Request Failed To Load Users Orders', error.message);
    }
};
