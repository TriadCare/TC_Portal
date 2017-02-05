import React from 'react';
import { Dialog } from '@blueprintjs/core';

import { validation, validateEmail, submitForgotPassword } from '../util.js';

const TOKEN_EXPIRATION_SECONDS = 1800;

class forgotPassword extends React.Component {
  constructor() {
    super();
    this.state = {
      formSubmitted: false,
      email: '',
      status: undefined,
      valid: false,
      errorMessage: '',
      submissionSuccess: false,
      tokenExpiresIn: 0,
    };
  }

  timerTick = () => {
    this.setState({ tokenExpiresIn: this.state.tokenExpiresIn - 1 });
    if (this.state.tokenExpiresIn <= 0) {
      clearInterval(this.interval);
    }
  }

  submitSuccess = () => {
    const expireTime = TOKEN_EXPIRATION_SECONDS;
    this.setState({ submissionSuccess: true, tokenExpiresIn: expireTime });
    this.interval = setInterval(this.timerTick, 1000);
  }

  submitFailure = (error) => {
    let failureMessage = '';
    switch (error.code) {
      case 400:
        failureMessage = error.message;
        break;
      case 401:
        failureMessage = 'Uh oh. This email isn\'t registered yet.';
        break;
      case 404:
        failureMessage = 'Hm. We couldn\'t find this email address.';
        break;
      default:
        failureMessage = 'Oops! Someting went wrong.';
        break;
    }

    this.setState({ errorMessage: failureMessage });
  }

  handleChange = (e) => {
    const isValid = validateEmail(e.target.value);
    this.setState({
      email: e.target.value,
      status: (
        isValid ? validation.DEFAULT : validation.WARNING
      ),
      valid: isValid,
      errorMessage: (
        isValid ? '' : 'This email address is invalid.'
      ),
    });
  }

  submit = (e) => {
    e.preventDefault();

    const isValid = validateEmail(this.state.email);
    const status = isValid ? validation.DEFAULT : validation.ERROR;

    this.setState({
      formSubmitted: true,
      status,
      valid: isValid,
      errorMessage: (
        isValid ? '' : 'This email address is invalid.'
      ),
    });

    if (isValid) {
      submitForgotPassword(
        this.state.email,
        this.submitSuccess,
        this.submitFailure);
    }
  }

  render() {
    return (
      <div className="formContainer formSmall">
        <h1 className="formTitle">Forgot Password</h1>
        <form onSubmit={this.submit} className="auth-form form-forgot">
          <label htmlFor={'email'} className="form__label">
            {'Email'}
            {(this.state.formSubmitted && this.state.errorMessage !== '') ?
              <div className="fieldError">
                <span>{this.state.errorMessage}</span>
              </div> : ''
            }
            <div className="pt-input-group">
              <span className={'pt-icon pt-icon-envelope'}></span>
              <input
                className={`pt-input
                  ${this.state.formSubmitted &&
                    this.state.status !== undefined &&
                    `pt-intent-${this.state.status}`
                  }
                `}
                id="email"
                name="email"
                type="text"
                dir="auto"
                onChange={this.handleChange}
                value={this.state.email}
              />
              {(this.state.formSubmitted &&
                this.state.errorMessage !== '' &&
                <span className="pt-icon pt-icon-error fieldError"></span>)}
            </div>
          </label>
          <button
            className="pt-button pt-intent-primary form__submit-button"
            type="submit"
          >
            Request Reset Email
          </button>
        </form>
        <div className="form__footer">
          <p className="form__description">
            We'll email you instructions for setting a new password.
          </p>
        </div>
        <div>
          <Dialog
            iconName="thumbs-up"
            isOpen={this.state.submissionSuccess}
            isCloseButtonShown={false}
            title={`You're all set. This action expires in
            ${this.state.tokenExpiresIn} seconds.`}
            className="dialog-auth"
          >
            <div className="pt-dialog-body">
              <p>We sent you the Password Reset Email.</p>
              <p>Check your email and follow the instructions
              to set your new password.</p>
              <p>You can close this window or <a href="/login">go back</a>.</p>
            </div>
          </Dialog>
        </div>
      </div>
    );
  }

}

export const ForgotPassword = forgotPassword;
