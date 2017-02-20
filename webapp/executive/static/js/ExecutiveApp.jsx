import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect } from 'react-router';

import ExecutiveBaseLayout from './components/ExecutiveBase';
import SpaceContainer from 'components/SpaceContainer';

import ExecutiveDashboard from './components/ExecutiveDashboard';
// import ExecutiveReporting from './components/ExecutiveReporting';
import { profileComponent } from 'components/Profile';

import {
  ReduxStore as ExecutiveReduxStore,
  RouterHistory as ExecutiveRouterHistory,
} from './ExecutiveReduxStore';


ReactDOM.render(
  <Provider store={ExecutiveReduxStore}>
    <Router history={ExecutiveRouterHistory}>
      <Route path="/executive" component={ExecutiveBaseLayout}>
        <IndexRedirect to="dashboard" />
        <Route component={SpaceContainer}>
          <Route path="dashboard" component={ExecutiveDashboard} />
          { /* <Route path="reporting" component={ExecutiveReporting} /> */ }
          <Route path="profile" component={profileComponent} />
        </Route>
      </Route>
    </Router>
  </Provider>
  , document.getElementById('app'),
);
