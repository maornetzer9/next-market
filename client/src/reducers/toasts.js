export const TOAST_PUSH = "TOAST_PUSH";
export const TOAST_DISMISS = "TOAST_DISMISS";
export const TOAST_CLEAR = "TOAST_CLEAR";

const initialState = { items: [] };

export const toastsReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case TOAST_PUSH: {
      const toast = action.payload;
      const items = state.items.filter((entry) => entry.id !== toast.id);
      return { items: [...items, toast] };
    }
    case TOAST_DISMISS: {
      return { items: state.items.filter((entry) => entry.id !== action.payload) };
    }
    case TOAST_CLEAR: {
      return { items: [] };
    }
    default:
      return state;
  }
};
