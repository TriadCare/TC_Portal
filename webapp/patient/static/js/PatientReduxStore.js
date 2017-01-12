import thunkMiddleware from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';

import { IdentityReducer } from 'components/Identity';
import { fetchData } from 'components/Identity/actions';

import appReducer from './PatientReducer';

// Use this to "rehydrate" the store or provide initial configuration
const initialState = {};
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */
const store = createStore(
  combineReducers({
    identity: IdentityReducer,
    appState: appReducer,
    routing: routerReducer,
    form: formReducer,
  }),
  initialState,
  composeEnhancers(applyMiddleware(thunkMiddleware))
);

store.dispatch(fetchData('HRA', new Request('/hras/')));

/* eslint-enable */
export default store;
