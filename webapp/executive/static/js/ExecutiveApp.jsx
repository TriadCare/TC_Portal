import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import BaseLayout from 'components/BaseLayout';
import SpaceContainer from 'components/SpaceContainer';

import ExecutiveReduxStore from './ExecutiveReduxStore';

import { dashboardComponent } from 'components/Dashboard';
import { reportingComponent } from './components/Reporting';
import { cohortComponent } from './components/Cohort';
import { profileComponent } from 'components/Profile';

const history = syncHistoryWithStore(browserHistory, ExecutiveReduxStore);

ReactDOM.render(
  <Provider store={ExecutiveReduxStore}>
    <Router history={history}>
      <Route path="/executive" component={BaseLayout}>
        <IndexRedirect to="dashboard" />
        <Route component={SpaceContainer}>
          <Route path="dashboard" component={dashboardComponent} />
          <Route path="reporting" component={reportingComponent} />
          <Route path="cohort" component={cohortComponent} />
          <Route path="profile" component={profileComponent} />
        </Route>
      </Route>
    </Router>
  </Provider>
  , document.getElementById('app')
);
