import moment from 'moment';

// These strings match: pt-intent-[value]
export const validation = {
  DEFAULT: 'default', // Use this for no intent (not defined by blueprintjs)
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'danger',
  PRIMARY: 'primary',
};

export const validateEmail = (email) => {
  /* eslint-disable max-len */
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /* eslint-enable */
  return re.test(email);
};

export const validatePassword = (pw) => {
  /* eslint-disable max-len */
  const re = new RegExp(/^(?=.{8,128})(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+\\|{}\[\];:'"<>,.?/]).*$/);
  /* eslint-enable */
  return re.test(pw);
};

export const jwtDecode = (token) => token.split('.').splice(0, 2).map(
  (tokenPart) => JSON.parse(atob(tokenPart))
);
export const jwtExpireTime = (token) => jwtDecode(token)[0].exp * 1000;
export const jwtIsExpired = (token) => moment().diff(jwtExpireTime(token)) >= 0;
export const jwtPayload = (token) => jwtDecode(token)[1];

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
// (add headers and other request attributes before calling)
export const submitRequest = (r, success, error, failure) => {
  const request = new Request(r);

  fetch(request)
  .then(status)
  .then(
    (response) => json(response).then(success),
    (response) => json(response).then(error))
  .catch((reason) => {
    failure(reason);
    return Promise.reject();  // stop Promise chain
  });
};

// API Fetch Functions
export const loginUser = (userData, successCallback, errorCallback, failureCallback) => {
  const request = new Request(
    '/token/', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${userData.email}:${userData.password}`)}`,
      },
    }
  );

  submitRequest(
    request,
    successCallback,
    errorCallback,
    failureCallback
  );
};

export const registerNewUser = (userData, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  submitRequest(
    request,
    successCallback,
    errorCallback,
    failureCallback
  );
};

export const submitForgotPassword = (email, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/email/', {
    method: 'POST',
    body: JSON.stringify({ email, email_type: 'forgot_password' }),
  });

  submitRequest(
    request,
    successCallback,
    errorCallback,
    failureCallback
  );
};

export const submitSetPassword = (pw, token, successCallback, errorCallback, failureCallback) => {
  const userID = jwtPayload(token).userID;
  const request = new Request(`/users/${userID}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${btoa(token)}`,
    },
    body: JSON.stringify({ password: pw }),
  });

  submitRequest(
    request,
    successCallback,
    errorCallback,
    failureCallback
  );
};

export const submitHelpRequest = (helpData, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/email/', {
    method: 'POST',
    body: JSON.stringify({ ...{ email_type: 'get_help' }, ...helpData }),
  });

  submitRequest(
    request,
    successCallback,
    errorCallback,
    failureCallback
  );
};
