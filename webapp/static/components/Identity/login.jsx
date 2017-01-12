import React from 'react';
import { connect } from 'react-redux';
import { Dialog } from '@blueprintjs/core';

import { fetchJWT } from './actions';

import LoginForm from './forms/login';

const loginSubmit = (values, dispatch, onLogin) => fetchJWT(
  values.email,
  values.password,
  onLogin
)(dispatch);

const LoginComponent = (props) => (
  <div>
    <Dialog
      iconName="user"
      isOpen={props.isOpen}
      isCloseButtonShown={false}
      title="Your Session has Expired"
    >
      <div className="pt-dialog-body">
        <LoginForm
          userEmail={props.user ? props.user.email : ''}
          isWaiting={props.isWaiting}
          onSubmit={(values, dispatch) => loginSubmit(values, dispatch, props.onLogin)}
          submissionError={props.submissionError}
          emailError={props.emailError}
          pwError={props.pwError}
        />
      </div>
    </Dialog>
  </div>
);

LoginComponent.propTypes = {
  user: React.PropTypes.object,
  isOpen: React.PropTypes.bool.isRequired,
  isWaiting: React.PropTypes.bool.isRequired,
  submissionError: React.PropTypes.bool.isRequired,
  emailError: React.PropTypes.string.isRequired,
  pwError: React.PropTypes.string.isRequired,
  onLogin: React.PropTypes.func,
};

const mapStateToProps = (reduxStore) => ({
  userEmail: reduxStore.identity.user ? reduxStore.identity.user.email : undefined,
  isOpen: reduxStore.identity.needAuth,
  isWaiting: reduxStore.identity.requestedAuth,
  submissionError: reduxStore.identity.submissionError,
  emailError: reduxStore.identity.emailError,
  pwError: reduxStore.identity.pwError,
});

export default connect(mapStateToProps)(LoginComponent);
