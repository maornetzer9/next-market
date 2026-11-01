import { handleCreateCategory, handleDeleteCategories, handleLoadProducts, handleModifyProducts, handleUpdateCategories } from "../routes/products";

export const FETCH_PRODUCTS = 'FETCH_PRODUCTS';
export const FETCH_PRODUCTS_FAILURE = 'FETCH_PRODUCTS_FAILURE';

export const UPDATE_PRODUCT = 'UPDATE_PRODUCT';
export const UPDATE_PRODUCT_FAILURE = 'UPDATE_PRODUCT_FAILURE';

export const EDIT_PRODUCT = 'EDIT_PRODUCT';
export const EDIT_PRODUCT_FAILURE = 'EDIT_PRODUCT_FAILURE';

export const ADD_NEW_PRODUCT = 'ADD_NEW_PRODUCT';
export const ADD_NEW_PRODUCT_FAILURE = 'ADD_NEW_PRODUCT_FAILURE';

export const UPDATE_CATEGORIES = 'UPDATE_CATEGORIES';
export const UPDATE_CATEGORIES_FAILURE = 'UPDATE_CATEGORIES_FAILURE';

export const DELETE_CATEGORIES = 'DELETE_CATEGORIES';
export const DELETE_CATEGORIES_FAILURE = 'DELETE_CATEGORIES_FAILURE';

export const CREATE_CATEGORY = 'CREATE_CATEGORY';
export const CREATE_CATEGORY_FAILURE = 'CREATE_CATEGORY_FAILURE';


export const loadProductsAction = (url, options = {}) => async (dispatch) => {
    try
    {
        const response = await handleLoadProducts(url, Boolean(options.authenticated));
        const { code, message, products } = response;

        if( code !== 200 || !Array.isArray(products))
        {
            dispatch({ type: FETCH_PRODUCTS_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: FETCH_PRODUCTS, payload: products });
        return { code };
    }
    catch(err)
    {
        console.error('Failed to fetch products', err.message);
        dispatch({ type: FETCH_PRODUCTS_FAILURE, payload: err.message });
    }
};


export const modifyProductsAction = ( editedProduct, url ) => async ( dispatch ) => {
    try
    {
        const response = await handleModifyProducts( editedProduct, url );
        const { code, message, product } = response;

        if( code !== 200 || !product )
        {
            dispatch({ type: EDIT_PRODUCT_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: EDIT_PRODUCT, payload: product });
        return { code, message };
    }
    catch(error)
    {
        console.error('Failed To Edit Product', error.message);
        dispatch({ type: EDIT_PRODUCT_FAILURE, payload: error.message });
    }
};


export const updateCategoriesAction  = ( categories, url ) => async ( dispatch ) => {
    try
    {
        const response = await handleUpdateCategories( categories, url );
        const { code, message, updatedProducts, oldCategory } = response;

        if( code !== 200 || !updatedProducts || !oldCategory )
        {
            dispatch({ type: UPDATE_CATEGORIES_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: UPDATE_CATEGORIES, payload: { updatedProducts, oldCategory } });
        return { code, message };
    }
    catch(error)
    {
        console.error('Failed To Edit Product', error.message);
        dispatch({ type: UPDATE_CATEGORIES_FAILURE, payload: error.message });
    }
};


export const deleteCategoriesAction = ( category, url ) => async (dispatch) => {
    try
    {
        const response = await handleDeleteCategories( category, url );
        const { code, message, deletedCategory } = response

        if( code !== 200 || deletedCategory === "")
        {
            dispatch({ type: DELETE_CATEGORIES_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: DELETE_CATEGORIES, payload: deletedCategory });
        return { code, message };

    }
    catch(error)
    {
        console.error('Request Failed To Delete Category', error.message);
        dispatch({ type: DELETE_CATEGORIES_FAILURE, payload: error.message });

    }
};


export const createCategoryAction = (newCategory, url) => async (dispatch) => {
    try
    {
        const response = await handleCreateCategory(newCategory, url);
        const { code, message, createdCategory } = response;

        if (code !== 200)
        {
            dispatch({ type: CREATE_CATEGORY_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: CREATE_CATEGORY, payload: createdCategory });
        return { code, message };
    }
    catch(error)
    {
        console.error('Failed To Create Category', error.message);
        dispatch({ type: CREATE_CATEGORY_FAILURE, payload: error.message });
    }
};
