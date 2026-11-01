import { combineReducers } from 'redux';
import { userReducer } from './users';
import { productsReducer } from './products';
import { ordersReducer } from './orders';
import { cartReducer } from './cart';
import { toastsReducer } from './toasts';

export const rootReducer = combineReducers({
    userReducer,
    cartReducer,
    ordersReducer,
    productsReducer,
    toastsReducer,
});