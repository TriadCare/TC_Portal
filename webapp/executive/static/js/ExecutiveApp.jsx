import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';

import BaseLayout from 'components/BaseLayout';
import SpaceContainer from 'components/SpaceContainer';

import appReducer from './appReducer';
import { Dashboard, dashboardReducer } from './components/Dashboard';
import { Reporting, reportingReducer } from './components/Reporting';
import { Cohort, cohortReducer } from './components/Cohort';
import { Profile, profileReducer } from './components/Profile';

// Use this to "rehydrate" the store or provide initial configuration
const initialState = {};
const store = createStore(combineReducers({
  appState: appReducer,
  dashboardState: dashboardReducer,
  reportingState: reportingReducer,
  cohortState: cohortReducer,
  profileState: profileReducer,
  routing: routerReducer,
}), initialState);

const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/executive" component={BaseLayout}>
        <IndexRedirect to="dashboard" />
        <Route component={SpaceContainer}>
          <Route path="dashboard" component={Dashboard} />
          <Route path="reporting" component={Reporting} />
          <Route path="cohort" component={Cohort} />
          <Route path="profile" component={Profile} />
        </Route>
      </Route>
    </Router>
  </Provider>
  , document.getElementById('app')
);
