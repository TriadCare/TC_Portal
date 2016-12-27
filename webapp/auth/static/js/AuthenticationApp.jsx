import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';

import AuthBase from './components/AuthBase';

import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { SetPassword } from './components/SetPassword';
import { GetHelp } from './components/GetHelp';


ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={AuthBase}>
      <IndexRedirect to="login" />
      <Route path="login" component={Login} />
      <Route path="register" component={Register} />
      <Route path="forgot" component={ForgotPassword} />
      <Route path="set" component={SetPassword} />
      <Route path="help" component={GetHelp} />
    </Route>
  </Router>,
  document.getElementById('app')
);
