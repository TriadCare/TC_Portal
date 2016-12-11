import React from 'react';
import { connect } from 'react-redux';
import { Dialog } from '@blueprintjs/core';

import { fetchJWT } from './actions';

import LoginForm from './forms/login';

const loginSubmit = (values, dispatch) => fetchJWT(values.email, values.password)(dispatch);

const LoginComponent = (props) => (
  <div>
    <Dialog
      iconName="user"
      isOpen={props.isOpen}
      isCloseButtonShown={false}
      title="Your Session has Expired"
    >
      <div className="pt-dialog-body">
        <LoginForm onSubmit={loginSubmit} />
      </div>
    </Dialog>
  </div>
);

LoginComponent.propTypes = {
  userEmail: React.PropTypes.string,
  isOpen: React.PropTypes.bool.isRequired,
  isWaiting: React.PropTypes.bool.isRequired,
  emailError: React.PropTypes.bool,
  pwError: React.PropTypes.bool,
};

const mapStateToProps = (reduxStore) => ({
  userEmail: reduxStore.identity.user ? reduxStore.identity.user.email : undefined,
  isOpen: reduxStore.identity.needAuth,
  isWaiting: reduxStore.identity.requestedAuth,
  emailError: reduxStore.identity.emailError,
  pwError: reduxStore.identity.pwError,
});

export default connect(mapStateToProps)(LoginComponent);
