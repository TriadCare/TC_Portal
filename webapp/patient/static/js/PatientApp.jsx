import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import PatientBaseLayout from './components/PatientBase';
import SpaceContainer from 'components/SpaceContainer';

import PatientReduxStore from './PatientReduxStore';

import PatientDashboard from './components/PatientDashboard';
import { profileComponent } from 'components/Profile';


const history = syncHistoryWithStore(browserHistory, PatientReduxStore);

ReactDOM.render(
  <Provider store={PatientReduxStore}>
    <Router history={history}>
      <Route path="/patient" component={PatientBaseLayout}>
        <IndexRedirect to="dashboard" />
        <Route component={SpaceContainer}>
          <Route path="dashboard" component={PatientDashboard} />
          <Route path="profile" component={profileComponent} />
        </Route>
      </Route>
    </Router>
  </Provider>
  , document.getElementById('app')
);
