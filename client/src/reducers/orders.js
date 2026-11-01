import { initialState } from "./users"
import { CLEAR_ORDERS, LOAD_ADMIN_ORDERS, LOAD_ADMIN_ORDERS_FAILURE, LOAD_ORDERS, LOAD_ORDERS_FAILURE, NEW_ORDER, NEW_ORDER_FAILURE } from "../actions/orderActions";
import { AUTH_FAILURE, LOGIN, USER_DISCONNECT } from "../actions/userActions";


export const ordersReducer = ( state = initialState, action ) => {
    switch (action.type)
    {
        case LOAD_ORDERS: {
            const { user, users } = action.payload;
            return {
                ...state,
                user,
                users,
                error: null
            }
        }
        case NEW_ORDER: {
            return {
                ...state,
                user: {
                    ...state.user,
                    orders: action.payload,
                    error: null
                }
            }
        }

        case LOAD_ADMIN_ORDERS: {
            return {
                ...state,
                users: action.payload,
                error: null
            }
        }

        case CLEAR_ORDERS:
        case USER_DISCONNECT:
        case AUTH_FAILURE:
        case LOGIN: {
            /* Drop prior-user order cache before the next authenticated load. */
            return {
                ...initialState,
            };
        }

        case NEW_ORDER_FAILURE:
        case LOAD_ORDERS_FAILURE:
        case LOAD_ADMIN_ORDERS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            }

        default : return state;
    }
}