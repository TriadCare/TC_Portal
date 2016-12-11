import React from 'react';
import { Link } from 'react-router';

import { validation, loginUser } from '../util.js';

const fields = [
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    icon: 'envelope',
    validationFunction: (value) => {
      let isValid = true;
      let message = '';

      if (value === '') {
        isValid = false;
        message = 'Your email is required.';
      } else {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        isValid = re.test(value);
        message = isValid ? '' : 'This email address is invalid.';
      }

      return [isValid, message];
    },
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    icon: 'lock',
    validationFunction: (value) => {
      let isValid = true;
      let message = '';

      if (value === '') {
        isValid = false;
        message = 'Your password is required.';
      }

      return [isValid, message];
    },
  },
];

class loginPage extends React.Component {
  constructor() {
    super();
    this.state = Object.assign(
      { formSubmitted: false },
      ...fields.map(d => ({
        [d.name]: {
          value: '',
          fieldStatus: undefined,
          valid: false,
          errorMesage: '',
        },
      }))
    );
  }

  loginSuccess = (data) => {
    this.setState({
      jwt: data.jwt,
      formSuccess: 'Login Success!',
    });
    sessionStorage.setItem('tc_jwt', data.jwt);
    location.pathname = '/executive';  // redirect to correct portal
  }

  loginFailure = (error) => {
    switch (error.code) {
      case 401:
        this.setState({
          password: {
            ...this.state.password,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: 'Oops! Try your password again.',
          },
        });
        break;
      case 403:
        this.setState({
          email: {
            ...this.state.email,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: 'This email is not yet registered.',
          },
        });
        break;
      case 404:
        this.setState({
          email: {
            ...this.state.email,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: 'We don\'t have that email on file. Need to register?',
          },
        });
        break;
      default:
        break;
    }

    this.setState({
      formError: 'Login failed.',
      formMessage: 'Please check your credentials and try again.',
    });
  }

  submit = (e) => {
    e.preventDefault();

    this.setState({ formSubmitted: true });

    // Update validation for each field
    fields.forEach((field) => {
      const [isValid, message] = field.validationFunction(this.state[field.name].value);
      const status = this.state[field.name].valid ? validation.DEFAULT : validation.ERROR;
      this.setState({
        [field.name]: {
          ...this.state[field.name],
          valid: isValid,
          errorMessage: message,
          fieldStatus: status,
        },
      });
    });

    const valid = fields
                  .map((field) => field.name)       // For each field
                  .map((k) => this.state[k].valid)  // check if valid
                  .every((test) => test);           // only pass if all are valid

    if (valid) {
      loginUser({
        email: this.state.email.value,
        password: this.state.password.value,
      }, this.loginSuccess, this.loginFailure);
    }
  }

  handleChange = (e) => {
    const [isValid, message] = fields.filter((obj) => obj.name === e.target.name)[0]
      .validationFunction(e.target.value);
    this.setState({
      [e.target.name]: {
        value: e.target.value,
        fieldStatus: (
          isValid ? validation.DEFAULT : validation.WARNING
        ),
        valid: isValid,
        errorMessage: message,
      },
    });
  }

  renderFieldError = (errorMessage) => (
    <div className="fieldError">
      <span>{errorMessage}</span>
    </div>
  )

  renderField = (fieldProps) => (
    <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
      {fieldProps.label}
      {(this.state.formSubmitted &&
        this.state[fieldProps.name].errorMessage !== ''
        && this.renderFieldError(this.state[fieldProps.name].errorMessage))}
      <div className="pt-input-group">
        <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>
        <input
          className={`pt-input
            ${this.state.formSubmitted && this.state[fieldProps.name].fieldStatus !== undefined &&
              `pt-intent-${this.state[fieldProps.name].fieldStatus}`
            }
          `}
          id={fieldProps.name}
          name={fieldProps.name}
          type={fieldProps.type}
          dir="auto"
          onChange={this.handleChange}
          value={this.state[fieldProps.name].value}
        />
        {(this.state.formSubmitted &&
          this.state[fieldProps.name].errorMessage !== '' &&
          <span className="pt-icon pt-icon-error fieldError"></span>)}
      </div>
    </label>
  )

  render() {
    return (
      <div className="formContainer formSmall">
        <h1 className="formTitle">Welcome to the Triad Care Portal!</h1>
        {/* (this.state.formError &&
          this.state.formError !== '' &&
          <div className="pt-callout pt-intent-danger form-callout">
            <h5>{this.state.formError}</h5>
            {this.state.formMessage}
          </div>) */}
        <form onSubmit={this.submit} className="auth-form form-signin">
          {fields.map(this.renderField)}
          <button
            className="pt-button pt-intent-primary form__submit-button"
            type="submit"
          >
            Log In
          </button>
        </form>
        <div className="form__footer">
          <p className="form__description">Please log in to access your portal.</p>
          <Link
            to="/forgot"
            role="menuitem"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    );
  }

}

export const Login = loginPage;
