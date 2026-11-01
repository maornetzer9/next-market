import { initialState } from "./users";
import
{
    ADD_TO_CART,
    ADD_TO_CART_FAILURE,
    DELETE_FROM_CART,
    DELETE_FROM_CART_FAILURE,
    LOAD_CART,
    LOAD_CART_FAILURE,
    REMOVE_FROM_CART,
    REMOVE_FROM_CART_FAILURE,
    UPDATE_CART,
    UPDATE_CART_FAILURE
}
from "../actions/cartActions";
import { AUTH_FAILURE, LOADING, LOGIN, REGISTER, USER_DISCONNECT } from "../actions/userActions";

const emptyCartUser = () => ({
    cart: {
        items: [],
        total: 0,
    },
    orders: [],
});

const initialCartState = {
    ...initialState,
    hydrated: false,
};

export const cartReducer = (state = initialCartState, action) => {
    switch (action.type)
    {
        case LOADING: {
            return {
                ...state,
                loading: action.payload,
                error: null,
            }
        }
        case USER_DISCONNECT:
        case AUTH_FAILURE:
        case LOGIN:
        case REGISTER: {
            /* Drop prior-user cart on logout / before next authenticated load. */
            return {
                ...state,
                user: emptyCartUser(),
                loading: false,
                hydrated: false,
                error: null,
            };
        }
        case LOAD_CART: {
            return {
                ...state,
                user: {
                    ...state.user,
                    cart: {
                        items: action.payload.items,
                        total: action.payload.total
                    }
                },
                hydrated: true,
                error: null
            };
        }
        case LOAD_CART_FAILURE: {
            return {
                ...state,
                loading: false,
                hydrated: true,
                error: action.payload,
            };
        }
        case ADD_TO_CART: {
            const { newProduct, total } = action.payload;

            const index = state.user.cart.items.findIndex((item) => item.id == newProduct.id);

            let updatedItems;

            if (index !== -1)
            {
                updatedItems = state.user.cart.items.map((item, i) =>
                    i == index ? newProduct : item
                );
            }
            else
            {
                updatedItems = [...state.user.cart.items, newProduct];
            }

            const newState = {
                ...state,
                user: {
                    ...state.user,
                    cart: {
                        items: updatedItems,
                        total: total
                    }
                },
                loading: false,
                error: null
            };

            return newState;
        }
        case REMOVE_FROM_CART: {
            const { updatedProduct, total } = action.payload;

            let updatedItems;

            if ( Array.isArray(updatedProduct) )
            {
                updatedItems = updatedProduct;
            }
            else
            {
                const index = state.user.cart.items.findIndex((item) => item.id == updatedProduct.id);
                if (index !== -1)
                {
                    updatedItems = state.user.cart.items.map((item, i) =>
                        i === index ? updatedProduct : item
                    );
                }
                else
                {
                    updatedItems = [...state.user.cart.items];
                }
            }

            return {
                ...state,
                user: {
                    ...state.user,
                    cart: {
                        items: updatedItems,
                        total,
                    }
                },
                loading: false,
                error: null
            };
        }
        case DELETE_FROM_CART: {
            const { cart, total } = action.payload;
            return {
                ...state,
                user: {
                    ...state.user,
                    cart: {
                        items: cart,
                        total
                    }
                },
                error: null
            };
        }
        case UPDATE_CART: {
            return {
                ...state,
                user: {
                    ...state.user,
                    cart: {
                        ...state.user.cart,
                        items: action.payload.items,
                        total: action.payload.total
                    },
                    error: null
                }
            };
        }
        case UPDATE_CART_FAILURE:
        case ADD_TO_CART_FAILURE:
        case REMOVE_FROM_CART_FAILURE:
        case DELETE_FROM_CART_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};
