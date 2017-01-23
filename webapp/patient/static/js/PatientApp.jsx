import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect } from 'react-router';

import PatientBaseLayout from './components/PatientBase';
import SpaceContainer from 'components/SpaceContainer';

import {
  ReduxStore as PatientReduxStore,
  RouterHistory as PatientRouterHistory,
} from './PatientReduxStore';

import PatientDashboard from './components/PatientDashboard';
import PatientHRASurvey from './components/PatientHRASurvey';
import { profileComponent } from 'components/Profile';

ReactDOM.render(
  <Provider store={PatientReduxStore}>
    <Router history={PatientRouterHistory}>
      <Route path="/patient" component={PatientBaseLayout}>
        <IndexRedirect to="dashboard" />
        <Route component={SpaceContainer}>
          <Route path="dashboard" component={PatientDashboard} />
          <Route path="hra" component={PatientHRASurvey} />
          <Route path="profile" component={profileComponent} />
        </Route>
      </Route>
    </Router>
  </Provider>
  , document.getElementById('app')
);
