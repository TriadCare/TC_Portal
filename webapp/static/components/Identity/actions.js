// Action Types and Creators
export const REQUEST_JWT = 'REQUEST_JWT';
export function requestJWT() {
  return {
    type: REQUEST_JWT,
  };
}

export const RECEIVE_JWT = 'RECEIVE_JWT';
export function receiveJWT(jwt) {
  return {
    type: RECEIVE_JWT,
    jwt,
  };
}

export const INVALID_JWT = 'INVALID_JWT';
export function invalidJWT() {
  return {
    type: INVALID_JWT,
  };
}

export const REQUEST_DATA = 'REQUEST_DATA';
export function requestData(endpoint) {
  return {
    type: REQUEST_DATA,
    endpoint,
    isFetching: true,
  };
}

export const RECEIVE_DATA = 'RECEIVE_DATA';
export function receiveData(endpoint, data) {
  return {
    type: RECEIVE_DATA,
    endpoint,
    isFetching: false,
    data,
    receivedAt: Date.now(),
  };
}

// helper function for checking cached
function shouldFetchData(state, endpoint) {
  const data = state[endpoint];
  if (!data) {
    return true;
  }
  if (data.isFetching) {
    return false;
  }
  return data.isInvalidated;
}

// Async Action Creators! - Uses Redux-Thunk

// Use this to invalidate the JWT
export function invalidateJWT() {
  sessionStorage.removeItem('tc_jwt');
  return (dispatch) => dispatch(invalidJWT());
}

// Use this to refresh the current JWT.
export function updateJWT() {
  // try to update JWT if we have an existing one
  return (dispatch, getState) => {
    const jwt = getState().identity.jwt;
    if (jwt === undefined) {
      dispatch(invalidJWT());
      return;
    }
    fetch('/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(jwt)}`,
      },
    })
    .then(response => response.json())
    .then(json => dispatch(receiveJWT(json.jwt)));
  };
}

export function fetchJWT(email, password) {
  const authString = btoa(`${email}:${password}`);
  return (dispatch) => {
    sessionStorage.removeItem('tc_jwt');
    dispatch(requestJWT());
    fetch('/token', {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })
    .then(response => response.json())
    .then(json => {
      sessionStorage.setItem('tc_jwt', json.jwt);
      dispatch(receiveJWT(json.jwt));
    });
  };
}

// Use for fetching data if needed
export function fetchDataFrom(endpoint) {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchData(state, endpoint)) {
      const jwt = state.identity.jwt;
      // Let Redux know we are now requesting data from the given endpoint
      dispatch(requestData(endpoint));
      // Then build and make the request
      return fetch(`/${endpoint}`, {
        headers: {
          Authorization: `Basic ${btoa(jwt)}`,
        },
      })
      .then(response => response.json())
      .then(json => dispatch(receiveData(endpoint, json))
      );
    }
    return Promise.resolve();
  };
}
