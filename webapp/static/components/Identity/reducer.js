import { setJWT, getJWT, jwtExpireTime, jwtIsExpired } from 'js/utilREST';
import * as actions from './actions';

const getJWTState = () => {
  const jwt = getJWT();
  return {
    jwt: getJWT(jwt),
    jwtExp: jwtExpireTime(jwt),
    user: undefined,
    needAuth: jwtIsExpired(jwt),
    requestedAuth: false,
    submissionError: false,
    emailError: '',
    pwError: '',
  };
};

const reducer = (state = getJWTState(), action) => {
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
      if (action.response.error) {
        return {
          jwt: undefined,
          jwtExp: undefined,
          user: undefined,
          needAuth: true,
          requestedAuth: false,
          submissionError: true,
          emailError: action.response.code === 404 ? 'Email not found' : '',
          pwError: action.response.code === 401 ? 'Incorrect Password' : '',
        };
      }
      setJWT(action.response.jwt);
      return getJWTState();
    case actions.POST_ERROR:
    case actions.REQUEST_ERROR:
      return getJWTState();
    default: return state;
  }
};

export default reducer;
