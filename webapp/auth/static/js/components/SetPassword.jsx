import React from 'react';
import { Dialog } from '@blueprintjs/core';

import {
  validation, validatePassword,
  submitSetPassword,
} from '../util.js';

import { jwtIsExpired } from 'js/utilREST';

const checkToken = (token) => {
  let results = ['', '', false];
  if (token === undefined) {
    results = [
      'Missing Token!',
      (<div>
        <p>Looks like you're missing your identification token!</p>
        <p>Head over <a href="/forgot">here to get a Reset Password link.</a></p>
      </div>),
      true,
    ];
  } else if (jwtIsExpired(token)) {
    results = [
      'Expired Token!',
      (<div>
        <p>
          Looks like it's been too long since we
          sent you the Password Reset Email.
        </p>
        <p>
          Head over <a href="/forgot">here to request a new one.</a>
        </p>
      </div>),
      true,
    ];
  }
  return results;
};

class setPassword extends React.Component {
  constructor(props) {
    super(props);
    const token = this.props.location.query.jwt;
    const [dialogTitle, dialogMessage, showDialog] = checkToken(token);
    this.state = {
      formSubmitted: false,
      dialogIcon: 'thumbs-down',
      dialogTitle,
      dialogMessage,
      password: '',
      status: undefined,
      valid: false,
      errorMessage: '',
      showPassword: false,
      showDialog,
    };
  }

  togglePasswordVisibility = () => this.setState({ showPassword: !this.state.showPassword });

  submitSuccess = () => this.setState({
    showDialog: true,
    dialogIcon: 'thumbs-up',
    dialogTitle: 'You\'re all set!',
    dialogMessage: <p>Let's get you <a href="/login">logged in!</a></p>,
  })

  submitFailure = (error) => {
    let failureMessage = '';
    switch (error.code) {
      case 401:
        failureMessage = 'This user could not be found or is not yet registered.';
        break;
      case 403:
        failureMessage = 'You\'re not authorized to set a password for this user.';
        break;
      default:
        failureMessage = 'Someting went wrong.';
        break;
    }

    this.setState({ errorMessage: failureMessage });
  }

  handleChange = (e) => {
    const isValid = validatePassword(e.target.value);
    this.setState({
      password: e.target.value,
      status: (
        isValid ? validation.DEFAULT : validation.WARNING
      ),
      valid: isValid,
      errorMessage: (
        isValid ? '' : 'Does not meet the complexity requirements.'
      ),
    });
  }

  submit = (e) => {
    e.preventDefault();

    const token = this.props.location.query.jwt;
    const [dialogTitle, dialogMessage, showDialog] = checkToken(token);
    if (jwtIsExpired(token)) {
      this.setState({
        dialogTitle,
        dialogMessage,
        showDialog,
      });
      return;
    }

    const isValid = validatePassword(this.state.password);
    const status = isValid ? validation.DEFAULT : validation.ERROR;

    this.setState({
      formSubmitted: true,
      status,
      valid: isValid,
      errorMessage: (
        isValid ? '' : 'Does not meet the complexity requirements.'
      ),
    });

    if (isValid) {
      submitSetPassword(
        this.state.password,
        token,
        this.submitSuccess,
        this.submitFailure);
    }
  }

  render() {
    return (
      <div className="formContainer formSmall">
        <h1 className="formTitle">Set New Password</h1>
        <form onSubmit={this.submit} className="auth-form form-set">
          <label htmlFor={'password'} className="form__label">
            {'New Password'}
            {(this.state.formSubmitted && this.state.errorMessage !== '') ?
              <div className="fieldError">
                <span>{this.state.errorMessage}</span>
              </div> : ''
            }
            <div className="pt-input-group">
              <span className={'pt-icon pt-icon-lock'}></span>
              <input
                className={`pt-input
                  ${this.state.formSubmitted &&
                    this.state.status !== undefined &&
                    `pt-intent-${this.state.status}`
                  }
                `}
                id="password"
                name="password"
                type={this.state.showPassword ? 'text' : 'password'}
                dir="auto"
                onChange={this.handleChange}
                value={this.state.password}
              />
              {
                <span
                  className={
                    `pt-icon pt-icon-${this.state.showPassword ?
                      'eye-off' : 'eye-open'}
                      ${(this.state.formSubmitted &&
                        this.state.errorMessage !== '') ? ' fieldError' : ''}`
                  }
                  onClick={this.togglePasswordVisibility}
                ></span>}
            </div>
          </label>
          <button
            className="pt-button pt-intent-primary form__submit-button"
            type="submit"
          >
            Set New Password
          </button>
        </form>
        <div className="form__footer">
          <p className="form__description">
            Your password must contain one upper-case character,
            one lower-case character, one special character (!, $, &, etc),
            and it must be at least 8 characters long.
          </p>
        </div>
        <div>
          <Dialog
            iconName={this.state.dialogIcon}
            isOpen={this.state.showDialog}
            isCloseButtonShown={false}
            title={this.state.dialogTitle}
            className="dialog-auth"
          >
            <div className="pt-dialog-body">
              {this.state.dialogMessage}
            </div>
          </Dialog>
        </div>
      </div>
    );
  }
}

setPassword.propTypes = {
  location: React.PropTypes.object.isRequired,
};

export const SetPassword = setPassword;
