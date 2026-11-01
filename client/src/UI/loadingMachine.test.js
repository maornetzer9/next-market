import assert from "node:assert/strict";
import test from "node:test";

import { BOOTING, READY, REVEALING, initialLoadingState, loadingReducer } from "./loadingMachine.js";

test("V78 initial lifecycle is deterministic and idempotent", () => {
  const revealing = loadingReducer(initialLoadingState, { type: "CRITICAL_READY" });
  assert.equal(revealing.phase, REVEALING);
  assert.equal(loadingReducer(revealing, { type: "CRITICAL_READY" }), revealing);
  assert.equal(loadingReducer(revealing, { type: "REVEAL_COMPLETE" }).phase, READY);
});

test("V78 lifecycle cannot skip BOOTING or leave READY", () => {
  assert.equal(initialLoadingState.phase, BOOTING);
  assert.equal(loadingReducer(initialLoadingState, { type: "REVEAL_COMPLETE" }), initialLoadingState);
  const ready = { phase: READY };
  assert.equal(loadingReducer(ready, { type: "CRITICAL_READY" }), ready);
});
