import { handleLoadUsersOrders, handleLoadOrders, handleNewOrder } from "../routes/orders";
import { UPDATE_CART } from "./cartActions";

export const NEW_ORDER = 'NEW_ORDER';
export const NEW_ORDER_FAILURE = 'NEW_ORDER_FAILURE';

export const LOAD_ORDERS = 'LOAD_ORDERS'
export const LOAD_ORDERS_FAILURE = 'LOAD_ORDERS_FAILURE'
export const CLEAR_ORDERS = 'CLEAR_ORDERS'

export const LOAD_ADMIN_ORDERS = 'LOAD_ADMIN_ORDERS'
export const LOAD_ADMIN_ORDERS_FAILURE = 'LOAD_ADMIN_ORDERS_FAILURE'

export const clearOrdersAction = () => ({ type: CLEAR_ORDERS });

// Customer Actions
export const loadOrdersAction = ( _id, url, options = {} ) => async (dispatch) => {
    try
    {
        const response = await handleLoadOrders( _id, url, options );
        if (options.signal?.aborted) {
            return { code: 0, message: "aborted", aborted: true };
        }

        const { code, message, user, users } = response;

        if( code !== 200 || !user || !users )
        {
            dispatch({ type: LOAD_ORDERS_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: LOAD_ORDERS, payload: { user, users } });
        return { code, message };
    }
    catch(error)
    {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED" || options.signal?.aborted) {
            return { code: 0, message: "aborted", aborted: true };
        }
        console.error('Failed To Load Users', error.message);
        dispatch({ type: LOAD_ORDERS_FAILURE, payload: error.message });
        return { code: 500, message: error.message };
    }
};


export const newOrderAction = ( id, url, idempotencyKey ) => async (dispatch) => {
    try
    {
        const response = await handleNewOrder( id, url, idempotencyKey );
        const { code, message, orders, cart, idempotent } = response;

        if( code !== 200 || !orders || !cart )
        {
            dispatch({ type:  NEW_ORDER_FAILURE,      payload: message })
            return { code, message };
        }

        dispatch({ type: NEW_ORDER,      payload: orders })
        dispatch({ type: UPDATE_CART,    payload: cart })
        return { code, message, idempotent };
    }
    catch(error)
    {
        console.error('Failed To Add New Order', error.message);
        dispatch({ type: NEW_ORDER_FAILURE,      payload: error.message });
        return { code: 500, message: error.message };
    }

}

// ----------------------------------------------------------------------- //

//  Admin Actions
export const loadUsersOrders = (url) => async (dispatch) => {
    try
    {
        const response = await handleLoadUsersOrders( url );
        const { code, message, users } = response;

        if( code !== 200 || !users )
        {
            dispatch({ type: LOAD_ADMIN_ORDERS_FAILURE, payload: message });
            return { code, message };
        }

        dispatch({ type: LOAD_ADMIN_ORDERS, payload: users });
        return { code, message };

    }
    catch(error)
    {
        console.error('Failed To Load Users Orders', error.message);
        dispatch({ type: LOAD_ADMIN_ORDERS_FAILURE, payload: error.message });
        return { code: 500, message: error.message };
    }
};
