import axios from 'axios';
import { withAuth } from './auth';

export const handleLoadProducts = async ( url, authenticated = false ) => {
    try
    {
        const { data } = await axios.get(`${url}`, authenticated ? withAuth() : undefined);
        return data;
    }
    catch(err)
    {
        console.error(err.message);
        throw new Error('Error fetching products')
    }
};


export const handleModifyProducts = async ( product, url ) => {
    try
    {
        const { data } = await axios.put(url, { product }, withAuth());
        return data
    }
    catch(error)
    {
        console.error('Request Failed To Edit Product', error.message);
    }
};


export const handleUpdateCategories = async ( categories, url ) => {
    try
    {
        const { data } = await axios.put(url, { categories }, withAuth());
        return data
    }
    catch(error)
    {
        console.error('Request Failed To Update Category', error.message);

    }
};


export const handleDeleteCategories = async ( category, url ) => {
    try
    {
        const { data } = await axios.delete(url, withAuth({ data: { category } }));
        return data
    }
    catch(error)
    {
        console.error('Request Failed To Update Category', error.message);

    }
};


export const handleCreateCategory = async (newCategory, url) => {
    try
    {
        const response = await axios.post(url, { category: newCategory }, withAuth());
        return response.data;
    }
    catch(error)
    {
        console.error('Request Failed To Create Category', error.message);
        return { code: 500, message: 'Internal Server Error' };
    }
};
