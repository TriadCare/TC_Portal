import React from 'react';

const fields = [
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    icon: 'envelope',
  },
];

class forgotPassword extends React.Component {
  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
    };
  }

  submit = (e) => {
    alert(`You submitted ${this.state.email}, ${this.state.password}`);
    e.preventDefault();
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  renderField = (fieldProps) => (
    <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
      {fieldProps.label}
      <div className="pt-input-group">
        <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>
        <input
          className="pt-input"
          id={fieldProps.name}
          name={fieldProps.name}
          type={fieldProps.type}
          dir="auto"
          onChange={this.handleChange}
          value={this.state[fieldProps.name]}
        />
      </div>
    </label>
  )

  render() {
    return (
      <div className="formContainer formSmall">
        <h1 className="formTitle">Forgot Password</h1>
        <form onSubmit={this.submit} className="auth-form form-forgot">
          {fields.map(this.renderField)}
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
      </div>
    );
  }

}

export const ForgotPassword = forgotPassword;
