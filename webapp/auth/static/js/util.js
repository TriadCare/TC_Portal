import { submitRequest, jwtPayload } from 'js/utilREST';
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
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /* eslint-enable */
  return re.test(email);
};

export const validatePassword = (pw) => {
  /* eslint-disable max-len */
  const re = new RegExp(/^(?=.{8,128})(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+\\|{}[\];:'"<>,.?/]).*$/);
  /* eslint-enable */
  return re.test(pw);
};

// API Fetch Functions
export const loginUser = (userData, successCallback, errorCallback, failureCallback) => {
  const request = new Request(
    '/token/', {
      method: 'POST',
    },
  );

  submitRequest(
    request,
    `${userData.email}:${userData.password}`,
    successCallback,
    errorCallback,
    failureCallback,
  );
};

export const registerNewUser = (userData, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  submitRequest(
    request,
    undefined,
    successCallback,
    errorCallback,
    failureCallback,
  );
};

export const submitForgotPassword = (email, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/email/', {
    method: 'POST',
    body: JSON.stringify({ email, email_type: 'forgot_password' }),
  });

  submitRequest(
    request,
    undefined,
    successCallback,
    errorCallback,
    failureCallback,
  );
};

export const submitSetPassword = (pw, token, successCallback, errorCallback, failureCallback) => {
  const payload = jwtPayload(token);
  const userID = payload.userID || payload.recordID;
  const request = new Request(`/users/${userID}`, {
    method: 'PUT',
    body: JSON.stringify({ password: pw }),
  });

  submitRequest(
    request,
    token,
    successCallback,
    errorCallback,
    failureCallback,
  );
};

export const submitHelpRequest = (helpData, successCallback, errorCallback, failureCallback) => {
  const request = new Request('/email/', {
    method: 'POST',
    body: JSON.stringify({ ...{ email_type: 'get_help' }, ...helpData }),
  });

  submitRequest(
    request,
    undefined,
    successCallback,
    errorCallback,
    failureCallback,
  );
};
