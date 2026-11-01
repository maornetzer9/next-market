export const BOOTING = "BOOTING";
export const REVEALING = "REVEALING";
export const READY = "READY";

export const initialLoadingState = { phase: BOOTING };

export function loadingReducer(state, action) {
  if (action.type === "CRITICAL_READY" && state.phase === BOOTING) {
    return { phase: REVEALING };
  }
  if (action.type === "REVEAL_COMPLETE" && state.phase === REVEALING) {
    return { phase: READY };
  }
  return state;
}
