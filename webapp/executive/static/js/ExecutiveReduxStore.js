import thunkMiddleware from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';

import { /* IdentityActions, */ IdentityReducer } from 'components/Identity';

import appReducer from './ExecutiveReducer';
import { dashboardReducer } from './components/Dashboard';
import { reportingReducer } from './components/Reporting';
import { cohortReducer } from './components/Cohort';
import { profileReducer } from './components/Profile';

// Use this to "rehydrate" the store or provide initial configuration
const initialState = {};
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */
const store = createStore(
  combineReducers({
    identity: IdentityReducer,
    appState: appReducer,
    dashboardState: dashboardReducer,
    reportingState: reportingReducer,
    cohortState: cohortReducer,
    profileState: profileReducer,
    routing: routerReducer,
    form: formReducer,
  }),
  initialState,
  composeEnhancers(applyMiddleware(thunkMiddleware))
);

// store.dispatch(IdentityActions.updateJWT());
  // .then(() => store.dispatch(IdentityActions.requestData('hras')));

/* eslint-enable */
export default store;
