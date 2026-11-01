import { ADD_NEW_PRODUCT, ADD_NEW_PRODUCT_FAILURE, CREATE_CATEGORY, CREATE_CATEGORY_FAILURE, DELETE_CATEGORIES, DELETE_CATEGORIES_FAILURE, EDIT_PRODUCT, EDIT_PRODUCT_FAILURE, FETCH_PRODUCTS, FETCH_PRODUCTS_FAILURE, UPDATE_CATEGORIES, UPDATE_CATEGORIES_FAILURE, UPDATE_PRODUCT, UPDATE_PRODUCT_FAILURE } from "../actions/productActions";

const initialState = {
    product: {},
    products: [],
    error: null,
};


export const productsReducer = ( state = initialState, action ) => {
    switch (action.type)
    {
        case FETCH_PRODUCTS: {
            return {
                ...state,
                products: action.payload,
                error: null
            };
        }
        case UPDATE_PRODUCT: {
                const products = state.products.map((item) => item.id === action.payload.id ? action.payload : item);

                return {
                    ...state,
                    products,
                    error: null,
                };
        }
        case EDIT_PRODUCT: {

            let products = [...state.products];
            const index = state.products.findIndex((product) => product._id === action.payload._id);

            if( index !== -1 )
            {
                products[index] = action.payload;
            }
            else
            {
                products.push(action.payload);
            }

            return {
                ...state,
                products,
                product: state.product,
                error: null,
            }
        }
        case ADD_NEW_PRODUCT: {
            return {
                ...state,
                products: [...state.products, action.payload],
                product: state.product,
                error: null
            }
        }
        case UPDATE_CATEGORIES: {

            const { updatedProducts, oldCategory } = action.payload;
            const filteredProducts = state.products.filter((product) => product.category !== oldCategory);

            return {
                ...state,
                products: [ ...filteredProducts, ...updatedProducts ],
                product: state.product,
                error: null
            }

        }
        case DELETE_CATEGORIES: {
            const products = state.products.filter((product) => product.category !== action.payload);

            return {
                ...state,
                products,
                product: state.product,
                error: null
            }
        }
        case CREATE_CATEGORY: {
            const newCategory = action.payload;

            return {
                ...state,
                products: [...state.products, newCategory],
                error: null,
            };
        }

        case FETCH_PRODUCTS_FAILURE:
        case UPDATE_PRODUCT_FAILURE:
        case EDIT_PRODUCT_FAILURE:
        case ADD_NEW_PRODUCT_FAILURE:
        case UPDATE_CATEGORIES_FAILURE:
        case DELETE_CATEGORIES_FAILURE:
        case CREATE_CATEGORY_FAILURE:
            return {
                ...state,
                error: action.payload
            };

        default : return state;
    }
}