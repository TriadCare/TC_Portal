import moment from 'moment';

export const setJWT = (token) => sessionStorage.setItem('tc_jwt', token);
export const getJWT = () => sessionStorage.getItem('tc_jwt');
export const removeJWT = () => sessionStorage.removeItem('tc_jwt');

const ifDefined = (token, func) => {
  if (token === null || token === undefined || token === 'undefined' || token === '') {
    return undefined;
  }
  return func(token);
};

export const jwtDecode = (jwt = getJWT()) => ifDefined(jwt,
  (token) => token.split('.').splice(0, 2).map(
    (tokenPart) => JSON.parse(atob(tokenPart))
  ));
export const jwtExpireTime = (jwt = getJWT()) => ifDefined(jwt,
  (token) => jwtDecode(token)[0].exp * 1000);

export const jwtIsExpired = (jwt = getJWT()) => {
  const result = ifDefined(jwt,
    (token) => moment().diff(jwtExpireTime(token)) >= 0
  );
  if (result === undefined) {
    return true;
  }
  return result;
};

export const jwtPayload = (jwt = getJWT()) => ifDefined(jwt,
  (token) => jwtDecode(token)[1]);

// Fetch Promise Helpers
function json(response) {
  return response.json();
}
function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }
  return Promise.reject(response);
}

// API Fetch Wrapper
// Takes a request object (can be a Request or object) and callbacks
// (can add headers and other request attributes before calling)
export const submitRequest = (r, token, success, error, failure) => {
  const request = new Request(r);

  if (token !== undefined) {
    // should check validity of JWT and request update if needed.
    request.headers.set('Authorization', `Basic ${btoa(token)}`);
  }

  fetch(request)
  .then(status)
  .then(
    (response) => json(response).then(success),
    (response) => json(response).then(error))
  .catch((reason) => {
    /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
    console.error(reason);
    failure(reason);
  });
};
