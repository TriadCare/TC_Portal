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


// These strings match: pt-intent-[value]
export const validation = {
  DEFAULT: 'default', // Use this for no intent (not defined by blueprintjs)
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'danger',
  PRIMARY: 'primary',
};

// API Fetch Functions
export const loginUser = (userData, successCallback, errorCallback, failureCallback) => (
  fetch('/api_token', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(`${userData.email}:${userData.password}`)}`,
    },
  })
  .then(status)
  .then(
    (response) => json(response).then(successCallback),
    (response) => json(response).then(errorCallback))
  .catch((reason) => {
    failureCallback(reason);
    return Promise.reject();  // stop Promise chain
  })
);

export const registerNewUser = (userData, successCallback, errorCallback, failureCallback) => {
  const data = userData;
  return fetch('/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  .then(status)
  .then(
    (response) => json(response).then(successCallback),
    (response) => json(response).then(errorCallback))
  .catch((reason) => {
    failureCallback(reason);
    return Promise.reject();  // stop Promise chain
  });
};
