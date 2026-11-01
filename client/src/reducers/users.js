import
{
        AUTH,
        AUTH_FAILURE,
        LOGIN,
        LOGIN_FAILURE,
        REGISTER,
        REGISTER_FAILURE,
        USER_DETAILS_UPDATE,
        USER_DETAILS_UPDATE_FAILURE,
        USER_DISCONNECT,
        USER_DISCONNECT_FAILURE
 }
from "../actions/userActions";


export const initialState = {
    user:
    {
        cart: {
            items: [],
            total: 0
        },
        orders: []
    },
    users: [],
    loading: false,
    error: null
};


export const userReducer = (( state = initialState, action  ) => {
    switch (action.type)
    {
        case AUTH : {
            return {
                ...state,
                user: action.payload,
                error: null
            }
        }

        case LOGIN : {
            return {
                ...state,
                user: action.payload,
                error: null
            }
        }

        case REGISTER: {
            return {
                ...state,
                users: [...state.users, action.payload],
                error: null,
            };
        }

        case USER_DETAILS_UPDATE: {

            return {
                ...state,
                user: action.payload,
                error: null
            }
        }

        case USER_DISCONNECT: {

            return {
                ...state,
                user: null,
                users: null,
                error: null
            }
        }

        case AUTH_FAILURE:
            return {
                ...initialState,
                error: action.payload,
            };
        case LOGIN_FAILURE:
        case REGISTER_FAILURE:
        case USER_DETAILS_UPDATE_FAILURE:
        case USER_DISCONNECT_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        default: return state;
    }
})
