import * as actions from './actions';

let jwt = (sessionStorage.getItem('tc_jwt') || undefined);
let jwtExp = (jwt === undefined) ?
  undefined :
  ((JSON.parse(window.atob(jwt.split('.')[0]))).exp || undefined);
// Also need to check expiration and remove if needed.
if (new Date().getTime() > (jwtExp * 1000)) {
  jwt = jwtExp = undefined;
  sessionStorage.removeItem('tc_jwt');
}

const initialState = {
  jwt,
  jwtExp,
  user: undefined,
  needAuth: (jwt === undefined),
  requestedAuth: false,
  emailError: false,
  pwError: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.INVALID_JWT:
      return {
        ...state,
        ...{
          jwt: undefined,
          needAuth: true,
        },
      };
    case actions.REQUEST_JWT:
      return {
        ...state,
        ...{
          jwt: undefined,
          requestedAuth: true,
        },
      };
    case actions.RECEIVE_JWT:
      return {
        jwt: action.jwt,
        jwtExp: JSON.parse(
          window.atob(action.jwt.split('.')[0])
        ).exp,  // need to unwrap token to get time of session expiration
        user: JSON.parse(
          window.atob(action.jwt.split('.')[1])
        ),  // need to unwrap token to get user
        needAuth: false,
        requestedAuth: false,
      };
    default: return state;
  }
};

export default reducer;
