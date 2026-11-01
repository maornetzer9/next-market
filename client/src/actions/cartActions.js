import { LOADING } from "./userActions";
import {  handleAddToCart,  handleDeleteFromCart,  handleLoadCart,  handleRemoveFromCart } from "../routes/cart";

export const LOAD_CART = 'LOAD_CART';
export const LOAD_CART_FAILURE = 'LOAD_CART_FAILURE';

export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_TO_CART_FAILURE = 'ADD_TO_CART_FAILURE';

export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const REMOVE_FROM_CART_FAILURE = 'REMOVE_FROM_CART_FAILURE';

export const DELETE_FROM_CART = 'DELETE_FROM_CART';
export const DELETE_FROM_CART_FAILURE = 'DELETE_FROM_CART_FAILURE';

export const UPDATE_CART = 'UPDATE_CART';
export const UPDATE_CART_FAILURE = 'UPDATE_CART_FAILURE';


export const loadCartAction = ( userId, CART_URL_LOAD ) => async (dispatch, getState) => {
    try
    {
        if (!userId) {
            return { code: 401, message: "Sign in required" };
        }

        const data = await handleLoadCart(userId, CART_URL_LOAD);
        const { code, message, cart } = data;

        if( code !== 200 || !cart )
        {
            dispatch({ type: LOAD_CART_FAILURE, payload: message || "Failed to load cart" });
            return { code, message };
        }

        const currentUserId = getState()?.userReducer?.user?._id;
        if (currentUserId !== userId) {
            return { code: 0, message: "Stale cart response ignored" };
        }

        dispatch({ type: LOAD_CART, payload: cart });
        return { code };
    }
    catch(error)
    {
        dispatch({ type: LOAD_CART_FAILURE, payload: error.message });
    }
};


export const addToCartAction = ( userId, product, url, quantity = 1 ) => async (dispatch) => {
    try
    {
        dispatch({ type: LOADING, payload: true });
        const response = await handleAddToCart(userId, product, url, quantity);
        const { code, message, newProduct, total } = response;

        if( code !== 200 || !newProduct)
        {
            dispatch({ type: ADD_TO_CART_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: ADD_TO_CART, payload: { newProduct, total, message } });
        return { code, message, newProduct };
    }
    catch(error)
    {
        dispatch({type: ADD_TO_CART_FAILURE, payload: error.message});
        return { code: 5, message: error.message };
    }
};


export const removeFromCartAction = ( userId, product, url ) =>  async (dispatch) => {
    try
    {
        dispatch({ type: LOADING, payload: true });
        const response = await handleRemoveFromCart( userId, product, url );
        const { code, message, updatedProduct, total } = response;

        if( code !== 200 || !updatedProduct )
        {
            dispatch({ type: REMOVE_FROM_CART_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({type: REMOVE_FROM_CART, payload: { updatedProduct, total } });
        return { code, updatedProduct, total };
    }
    catch(error)
    {
        dispatch({type: REMOVE_FROM_CART_FAILURE, payload: error.message});
        return { code: 6, message: error.message };
    }
};


export const deleteFromCartAction = ( id, _id, url ) =>  async (dispatch) => {
    try
    {
        const response = await handleDeleteFromCart( id, _id, url );
        const { code, message, cart, total } = response;

        if( code !== 200 || !cart )
        {

            dispatch({ type: DELETE_FROM_CART_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: DELETE_FROM_CART, payload: { cart, total} });
        return { code };
    }
    catch(error)
    {
        dispatch({ type: DELETE_FROM_CART_FAILURE, payload: error.message });
        return { code: 7, message: error.message };
    }
};