import { TOAST_PUSH, TOAST_DISMISS, TOAST_CLEAR } from "../reducers/toasts";

const DEFAULT_DURATION = 3200;
let toastCounter = 0;

const generateId = () => {
  toastCounter += 1;
  return `t-${Date.now().toString(36)}-${toastCounter}`;
};

export const dismissToast = (id) => ({ type: TOAST_DISMISS, payload: id });
export const clearToasts = () => ({ type: TOAST_CLEAR });

export const pushToast = ({ kind = "info", message, duration = DEFAULT_DURATION, id } = {}) => {
  if (!message) return { type: "TOAST_IGNORE" };
  return {
    type: TOAST_PUSH,
    payload: {
      id: id || generateId(),
      kind,
      message,
      duration,
      createdAt: Date.now(),
    },
  };
};

export const notifySuccess = (message, options = {}) => pushToast({ kind: "success", message, ...options });
export const notifyError = (message, options = {}) => pushToast({ kind: "error", message, ...options });
export const notifyInfo = (message, options = {}) => pushToast({ kind: "info", message, ...options });
