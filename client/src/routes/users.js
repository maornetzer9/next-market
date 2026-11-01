import axios from "axios";
import { withAuth } from './auth';

export const handleRegister = async ( user, url ) => {
    const { data } = await axios.post(url, user);
    return data
}

export const handleAuth = async ( token, url ) => {
    try
    {
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        return data
    }
    catch(err)
    {
        console.error('Failed to verify user', err.message);
        return { code: 3, message: err.message };
    }
};

export const handleLogin = async ( username, password, url) => {
    const { data } = await axios.post( url, { username, password } );
    return data;
}

export const handleCustomerUpdate = async ( form, url ) => {
    try
    {
        const { data } = await axios.put(url, { form }, withAuth());
        return data;
    }
    catch(error)
    {
        console.error('Request Failed To Update Customer Details:', error.message);
    }
};


export const handleDisconnect = async ( token, url ) => {
    try
    {
          const { data } = await axios.post(url, null, {
          headers: { Authorization: `Bearer ${token}` },
        });

        return data
    }
    catch(error)
    {
        console.error('Request Failed To Disconnect User', error.message);
    }
};
