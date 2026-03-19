const listeners = new Set();

let state = {
  open: false,
  payload: null,
};

export function getFeedbackState() {
  return state;
}

export function setFeedbackState(next) {
  const pendingResolve = state?.payload?.__resolve;
  if (typeof pendingResolve === 'function' && next?.payload?.__resolve !== pendingResolve) {
    pendingResolve(undefined);
  }

  state = next;
  listeners.forEach((fn) => fn(state));
}

export function subscribeFeedback(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
