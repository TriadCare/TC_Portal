import React from 'react';
import { Field, reduxForm } from 'redux-form';
// import { Button, Intent } from '@blueprintjs/core';

// Decorate the form component
const loginForm = (props) => (
  <form onSubmit={props.handleSubmit}>
    <div>
      <label
        className="pt-label"
        htmlFor="email"
      >
        Email
        {(props.submissionError && props.emailError !== '') ?
          <div style={{ color: '#db3737', float: 'right' }}>
            <span>{props.emailError}</span>
          </div> : ''
        }
        <div className="pt-input-group">
          <span className="pt-icon pt-icon-envelope"></span>
          <Field
            name="email"
            component="input"
            className={`pt-input pt-fill ${props.emailError ? 'pt-intent-danger' : ''}`}
            type="email"
            placeholder="jdoe@email.com"
            dir="auto"
            value={props.userEmail}
          />
        </div>
      </label>
    </div>
    <div>
      <label
        className="pt-label"
        htmlFor="password"
      >
        Password
        {(props.submissionError && props.pwError !== '') ?
          <div style={{ color: '#db3737', float: 'right' }}>
            <span>{props.pwError}</span>
          </div> : ''
        }
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
    {props.isWaiting ?
      <div className="pt-spinner pt-small">
        <div className="pt-spinner-svg-container">
          <svg viewBox="0 0 100 100">
            <path
              className="pt-spinner-track"
              d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
            ></path>
            <path
              className="pt-spinner-head"
              d="M 94.5 50 A 44.5 44.5 0 0 0 50 5.5"
            ></path>
          </svg>
        </div>
      </div> :
      <button
        className="pt-button pt-intent-primary"
        type="submit"
      >
        Sign In
      </button>
    }
  </form>
);

loginForm.propTypes = {
  userEmail: React.PropTypes.string,
  isWaiting: React.PropTypes.bool,
  handleSubmit: React.PropTypes.func.isRequired,
  submissionError: React.PropTypes.bool,
  emailError: React.PropTypes.string,
  pwError: React.PropTypes.string,
};

export default reduxForm({
  form: 'loginForm', // a unique name for this form
})(loginForm);
