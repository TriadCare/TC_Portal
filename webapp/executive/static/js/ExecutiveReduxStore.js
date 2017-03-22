import thunkMiddleware from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { browserHistory } from 'react-router';
import { routerReducer, routerMiddleware, syncHistoryWithStore } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';

// import { loadState, saveState } from 'js/utilLocalStorage';
import { IdentityReducer } from 'components/Identity';

import { refreshData } from './ExecutiveActions';
import appReducer from './ExecutiveReducer';

// Use this to "rehydrate" the store or provide initial configuration
const persistedState = {}; // loadState();
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */
const historyMiddleware = routerMiddleware(browserHistory);

const store = createStore(
  combineReducers({
    identity: IdentityReducer,
    appState: appReducer,
    routing: routerReducer,
    form: formReducer,
  }),
  persistedState,
  composeEnhancers(applyMiddleware(...[thunkMiddleware, historyMiddleware])),
);

// store.subscribe(() => saveState({
//   datasources: store.getState().datasources,
// }));

const history = syncHistoryWithStore(browserHistory, store);

store.dispatch(refreshData());

export const ReduxStore = store;
export const RouterHistory = history;
