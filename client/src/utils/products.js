import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadProductsAction } from "../actions/productActions";
import { loadCartAction, addToCartAction, removeFromCartAction } from "../actions/cartActions";
import { notifyError, notifyInfo, notifySuccess } from "../actions/toastActions";

const CART_URL_LOAD = `${import.meta.env.VITE_ORIGIN}/cart`;
const PRODUCTS_URL_LOAD = `${import.meta.env.VITE_ORIGIN}/products`;
const CART_MUTATION_TOAST_ID = "cart-mutation";

export const useLoadProducts = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        const fetchProducts = async () => {
            try
            {
                const result = await dispatch(loadProductsAction(PRODUCTS_URL_LOAD));
                if (active && result?.code !== 200) setError(result?.message || "Failed To Load Products");
            }
            catch(error)
            {
                console.error("Failed To Load Products", error.message);
                if (active) setError(error.message);
            }
            finally
            {
                if (active) setLoading(false);
            }
        };
        fetchProducts();
        return () => {
            active = false;
        };
    }, [dispatch]);

    return { loading, error };
};

export const useLoadCart = (enabled = true) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.userReducer.user);
    const userId = user?._id;

    useEffect(() => {
        if (!enabled || !userId) return undefined;

        let active = true;
        const fetchCart = async () => {
            try
            {
                await dispatch(loadCartAction(userId, CART_URL_LOAD));
            }
            catch(error)
            {
                if (active) console.error("Failed To Load Cart", error.message);
            }
        };
        fetchCart();
        return () => {
            active = false;
        };
    }, [dispatch, enabled, userId]);
};

export const useLoadData = () => {
    useLoadProducts();
    useLoadCart();
};

const CART_URL_ADD = `${import.meta.env.VITE_ORIGIN}/cart/add`;
const CART_URL_REMOVE = `${import.meta.env.VITE_ORIGIN}/cart/remove`;

const formatAddedMessage = (title, quantity) => {
    const safeTitle = title || "Product";
    const qty = Number(quantity) || 1;
    return qty > 1 ? `Added ${qty} × ${safeTitle} to cart` : `Added ${safeTitle} to cart`;
};

const formatQuantityUpdatedMessage = (title, quantity) => {
    const safeTitle = title || "Product";
    return `${safeTitle} quantity updated to ${quantity}`;
};

const formatRemovedMessage = (title) => `Removed ${title || "Product"} from cart`;

const formatCartError = (message, fallback = "Unable to update cart") => {
    const source = String(message || "").trim();
    if (!source) return fallback;
    if (/stock/i.test(source)) return source;
    if (/not found|internal|failed/i.test(source)) return fallback;
    return source;
};

const notifyCartMutation = (dispatch, message) => {
    dispatch(notifyInfo(message, { id: CART_MUTATION_TOAST_ID, duration: 2800 }));
};

/**
 * useCartOperations
 *
 * Authoritative cart mutation hook shared by the storefront (product grid,
 * cart page, floating cart, homepage). Feedback is routed through the global
 * toast reducer so consumers do not need to keep per-item message state.
 *
 * addToCart(product, quantity = 1): fires exactly one cart mutation regardless
 * of the quantity. The server (POST /cart/add) accepts the optional quantity
 * field and enforces stock server-side.
 *
 * removeFromCart(product): decrements the cart line quantity by one via
 * DELETE /cart/remove, matching the existing cart-page stepper behaviour.
 */
export const useCartOperations = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.userReducer.user);
    const userId = user?._id;
    const cartItems = useSelector((state) => state.cartReducer.user?.cart?.items) || [];

    const addToCart = useCallback(
        async (product, quantity = 1) => {
            if (!userId) {
                return { code: 401, message: "Sign in required" };
            }

            const qty = Math.max(1, Math.floor(Number(quantity) || 1));
            const existingLine = cartItems.find((item) => item.id === product?.id);
            try
            {
                const { code, message, newProduct } = await dispatch(
                    addToCartAction(userId, product, CART_URL_ADD, qty)
                );

                if (code !== 200)
                {
                    dispatch(notifyError(formatCartError(message)));
                    return { code, message };
                }

                if (existingLine) {
                    const nextQuantity = Number(newProduct?.quantity) || existingLine.quantity + qty;
                    notifyCartMutation(dispatch, formatQuantityUpdatedMessage(product?.title, nextQuantity));
                } else {
                    dispatch(notifySuccess(formatAddedMessage(product?.title, qty)));
                }

                return { code, message, newProduct };
            }
            catch(error)
            {
                dispatch(notifyError(formatCartError(error?.message)));
                return { code: 5, message: error?.message };
            }
        },
        [dispatch, userId, cartItems]
    );

    const removeFromCart = useCallback(
        async (product) => {
            if (!userId) {
                return { code: 401, message: "Sign in required" };
            }

            try
            {
                const { code, message, updatedProduct } = await dispatch(
                    removeFromCartAction(userId, product, CART_URL_REMOVE)
                );

                if (code !== 200)
                {
                    dispatch(notifyError(formatCartError(message, "Unable to update cart")));
                    return { code, message };
                }

                const remainingLine = Array.isArray(updatedProduct)
                    ? updatedProduct.find((item) => item.id === product?.id)
                    : null;

                if (remainingLine) {
                    notifyCartMutation(
                        dispatch,
                        formatQuantityUpdatedMessage(product?.title, remainingLine.quantity)
                    );
                } else {
                    notifyCartMutation(dispatch, formatRemovedMessage(product?.title));
                }

                return { code, updatedProduct };
            }
            catch(error)
            {
                dispatch(notifyError(formatCartError(error?.message, "Unable to update cart")));
                return { code: 6, message: error?.message };
            }
        },
        [dispatch, userId]
    );

    return { addToCart, removeFromCart };
};
