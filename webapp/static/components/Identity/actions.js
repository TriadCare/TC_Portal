import { submitRequest, removeJWT } from 'js/utilREST';
// Action Types and Creators
export const REQUEST_JWT = 'REQUEST_JWT';
export function requestJWT() {
  return {
    type: REQUEST_JWT,
  };
}

export const RECEIVE_JWT = 'RECEIVE_JWT';
export function receiveJWT(response) {
  return {
    type: RECEIVE_JWT,
    response,
  };
}

export const INVALID_JWT = 'INVALID_JWT';
export function invalidJWT() {
  return {
    type: INVALID_JWT,
  };
}

export const REQUEST_DATA = 'REQUEST_DATA';
export function requestData(dataName) {
  return {
    type: REQUEST_DATA,
    dataName,
    isFetching: true,
  };
}

export const POST_DATA = 'POST_DATA';
export function postData(dataName) {
  return {
    type: POST_DATA,
    dataName,
    isPosting: true,
  };
}

export const REQUEST_ERROR = 'REQUEST_ERROR';
export function requestError(dataName, errorResponse) {
  return {
    type: REQUEST_ERROR,
    dataName,
    isFetching: false,
    data: errorResponse,
  };
}

export const POST_ERROR = 'POST_ERROR';
export function postError(dataName, errorResponse) {
  return {
    type: POST_ERROR,
    dataName,
    isPosting: false,
    data: errorResponse,
  };
}

export const REQUEST_FAILURE = 'REQUEST_FAILURE';
export function requestFailure(dataName) {
  return {
    type: REQUEST_FAILURE,
    dataName,
    isFetching: false,
    data: [],
  };
}

export const POST_FAILURE = 'POST_FAILURE';
export function postFailure(dataName) {
  return {
    type: POST_FAILURE,
    dataName,
    isPosting: false,
    data: [],
  };
}

export const RECEIVE_DATA = 'RECEIVE_DATA';
export function receiveData(dataName, data) {
  return {
    type: RECEIVE_DATA,
    dataName,
    isFetching: false,
    data,
    receivedAt: Date.now(),
  };
}

export const POST_RESULT = 'POST_RESULT';
export function postResult(dataName, data) {
  return {
    type: POST_RESULT,
    dataName,
    isPosting: false,
    data,
    receivedAt: Date.now(),
  };
}

// Async Action Creators! - Uses Redux-Thunk

// Use this to invalidate the JWT
export function invalidateJWT() {
  return (dispatch) => {
    removeJWT();
    dispatch(invalidJWT());
  };
}

// Use this to refresh the current JWT.
export function updateJWT() {
  // try to update JWT if we have an existing one
  return (dispatch, getState) => {
    const jwt = getState().identity.jwt;
    if (jwt === undefined || jwt === 'undefined') {
      invalidateJWT();
      return;
    }
    const request = new Request('/token/', { method: 'POST' });
    submitRequest(
      request,
      jwt,
      json => dispatch(receiveJWT(json)),
      json => dispatch(receiveJWT(json)),
      json => dispatch(receiveJWT(json))
    );
  };
}

export function fetchJWT(email, password, onLogin) {
  return (dispatch) => {
    dispatch(requestJWT());
    const request = new Request('/token/', { method: 'POST' });
    submitRequest(
      request,
      `${email}:${password}`,
      json => {
        dispatch(receiveJWT(json));
        if (typeof onLogin === 'function') {
          dispatch(onLogin());
        }
      },
      json => dispatch(receiveJWT(json)),
      json => dispatch(receiveJWT(json))
    );
  };
}

// helper function for checking cache
function shouldFetchData(state, dataName) {
  const data = state.datasources[dataName];
  if (!data || !data.items || data.items.length === 0) {
    return true;
  }
  if (data.isFetching) {
    return false;
  }
  return !data.isFresh;
}

// Use for fetching data if needed
// use force flag to skip data freshness check
export function fetchData(dataName, request, force = false) {
  return (dispatch, getState) => {
    const state = getState();
    if (force || shouldFetchData(state.appState, dataName)) {
      const jwt = state.identity.jwt;
      // Let Redux know we are now requesting data from the given endpoint
      dispatch(requestData(dataName));
      // Then build and make the request
      submitRequest(
        request,
        jwt,
        json => dispatch(receiveData(dataName, json)),
        json => dispatch(requestError(dataName, json)),
        () => dispatch(requestFailure(dataName))
      );
    }
    return Promise.resolve();
  };
}

// Use for fetching data if needed
export function submitData(dataName, request, onSuccess) {
  return (dispatch, getState) => {
    const jwt = getState().identity.jwt;
    // Let Redux know we are now requesting data from the given endpoint
    dispatch(postData(dataName));
    // Then build and make the request
    submitRequest(
      request,
      jwt,
      json => {
        dispatch(postResult(dataName, json));
        if (typeof onSuccess === 'function') {
          dispatch(onSuccess());
        }
      },
      json => dispatch(postError(dataName, json)),
      () => dispatch(postFailure(dataName))
    );
    return Promise.resolve();
  };
}
