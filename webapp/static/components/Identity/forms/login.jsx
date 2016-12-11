import React from 'react';
import { Field, reduxForm } from 'redux-form';
// import { Button, Intent } from '@blueprintjs/core';

// Decorate the form component
const loginForm = (props) => (
  <form onSubmit={props.handleSubmit}>
    <div>
      <label
        className="pt-label .modifier"
        htmlFor="email"
      >
        Email
        <div className="pt-input-group">
          <span className="pt-icon pt-icon-envelope"></span>
          <Field
            name="email"
            component="input"
            className={`pt-input pt-fill ${props.emailError ? 'pt-intent-danger' : ''}`}
            type="email"
            placeholder="jdoe@email.com"
            dir="auto"
          />
        </div>
      </label>
    </div>
    <div>
      <label
        className="pt-label .modifier"
        htmlFor="password"
      >
        Password
        <div className="pt-input-group">
          <span className="pt-icon pt-icon-lock"></span>
          <Field
            name="password"
            component="input"
            className={`pt-input pt-fill ${props.pwError ? 'pt-intent-danger' : ''}`}
            type="password"
            dir="auto"
          />
        </div>
      </label>
    </div>
    <button
      className="pt-button pt-intent-primary"
      type="submit"
    >
    Sign In
    </button>
  </form>
);

loginForm.propTypes = {
  handleSubmit: React.PropTypes.func.isRequired,
  emailError: React.PropTypes.bool,
  pwError: React.PropTypes.bool,
};

export default reduxForm({
  form: 'loginForm', // a unique name for this form
})(loginForm);
