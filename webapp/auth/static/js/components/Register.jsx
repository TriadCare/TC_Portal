import React from 'react';
import moment from 'moment';
import { Position, RadioGroup, Radio, Popover, Dialog } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { validation, validateEmail, validatePassword, registerNewUser } from '../util.js';

const fields = [
  {
    name: 'id',
    label: 'ID',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'Your ID is required.'),
    ],
  },
  {
    name: 'id_type',
    radios: [
      { label: 'Triad Care ID', value: 'triadcare_id' },
      { label: 'Employee ID', value: 'employee_id' },
    ],
    type: 'radio_group',
    validationFunction: (value) => [  // auto-selects tcid
      !!value ? value : 'triadcare_id',
      true,
      '',
    ],
  },
  {
    name: 'first_name',
    label: 'First Name',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'Your first name is required.'),
    ],
  },
  {
    name: 'last_name',
    label: 'Last Name',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'Your last name is required.'),
    ],
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    validationFunction: (value) => {
      let isValid = true;
      let message = '';

      if (value === '') {
        isValid = false;
        message = 'Your email is required.';
      } else {
        isValid = validateEmail(value);
        message = isValid ? '' : 'This email address is invalid.';
      }

      return [value, isValid, message];
    },
  },
  {
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
    validationFunction: (value) =>
      [
        (value ? moment(value).format('YYYY-MM-DD') : ''),
        !!value,
        (!!value ? '' : 'Your date of birth is required.'),
      ],
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    popoverIsOpen: false,
    popoverContent:
      `Your password must contain one upper-case character,
      one lower-case character, one special character (!, $, &, etc),
      and it must be at least 8 characters long.`,
    validationFunction: (value) => {
      if (!value) {
        return [value, false, 'You have to set your password.'];
      }

      if (!validatePassword(value)) {
        return [
          value,
          false,
          ('Does not meet complexity requirements'),
        ];
      }

      return [value, true, ''];
    },
    showValid: true,
  },
  {
    name: 'confirm_password',
    label: 'Confirm Password',
    type: 'password',
    popoverIsOpen: false,
    popoverContent: 'Must match Password',
    validationFunction: 'Password',  // Name of field it must match
    showValid: true,
  },
];


class registerPage extends React.Component {
  constructor() {
    super();
    this.state = Object.assign({ formSubmitted: false, registrationSuccess: false },
      ...fields.map(field => ({
        [field.name]: {
          ...field,
          ...{
            value: '',
            fieldStatus: undefined,
            valid: false,
            errorMessage: '',
          },
        },
      })
      )
    );
  }

  onDateError = (date) => (
    date || moment().format('YYYY-MM-DD')
  )

  registrationSuccess = () => {
    this.setState({ registrationSuccess: true });
  }

  registrationFailure = (error) => {
    switch (error.code) {
      case 400:
        this.setState({
          [error.message.split(': ')[1]]: {
            ...this.state[error.message.split(': ')[1]],
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: 'Oops! We have something different on file.',
          },
        });
        break;
      case 401:
        this.setState({
          email: {
            ...this.state.email,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: error.message,
          },
        });
        break;
      case 403:
        this.setState({
          id: {
            ...this.state.id,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: 'Oops! This user is already registered!',
          },
        });
        break;
      case 404:
        this.setState({
          id: {
            ...this.state.id,
            valid: false,
            fieldStatus: validation.ERROR,
            errorMessage: error.message,
          },
        });
        break;
      default:
        break;
    }
  }

  submit = (e) => {
    e.preventDefault();

    let formIsValid = true;
    const newState = { formSubmitted: true };
    // Update validation for each field
    fields.forEach((field) => {
      let [formattedValue, isValid, message] = [undefined, undefined, undefined];
      const validationFunc = this.state[field.name].validationFunction;
      const value = this.state[field.name].value;
      if (validationFunc.toLowerCase !== undefined) {
        // Then it's a string, match the field value
        [formattedValue, isValid, message] =
          (value === this.state[validationFunc.toLowerCase()].value) ?
            [value, true, ''] :
            [value, false, 'Must match Password'];
      } else {
        [formattedValue, isValid, message] = validationFunc(value);
      }

      const validStatus = field.showValid ?
        validation.SUCCESS : validation.DEFAULT;
      const fieldStatus = isValid ? validStatus : validation.ERROR;

      newState[field.name] = {
        ...this.state[field.name],
        ...{
          value: formattedValue,
          valid: isValid,
          errorMessage: message,
          fieldStatus,
        },
      };

      formIsValid = isValid && formIsValid;
    });

    // After we make sure the state matches the contents of the form, attempt request.
    this.setState(newState, () => {
      if (formIsValid) {
        registerNewUser(Object.assign({},
          ...fields.map(field => ({
            [field.name]: this.state[field.name].value,
          }))
        ), this.registrationSuccess, this.registrationFailure);
      }
    });
  }


  wrapInPopover = (key, child) => (
    this.state[key].popoverContent ?
      (<Popover
        key={key}
        content={this.state[key].popoverContent}
        isOpen={this.state[key].popoverIsOpen}
        popoverClassName="pt-popover-content-sizing"
        position={Position.TOP}
        useSmartPositioning={false}
        autoFocus={false}
        enforceFocus={false}
      >
        {child}
      </Popover>) :
      child
  );

  handleChange = (e) => {
    // Date is handled differently, just the date is passed in, no target input
    const [name, value] = (e.target === undefined) ?
      ['dob', e] :  // NOTE: hardcoded field name here.
      [e.target.name, e.target.value];

    let [formattedValue, isValid, message] = [undefined, undefined, undefined];
    const validationFunc = this.state[name].validationFunction;

    if (validationFunc.toLowerCase !== undefined) {
      // Then it's a string, match the field value
      [formattedValue, isValid, message] =
        (value === this.state[validationFunc.toLowerCase()].value) ?
          [value, true, ''] :
          [value, false, `Must match ${validationFunc}.`];
    } else {
      [formattedValue, isValid, message] = validationFunc(value);
    }

    const validStatus = this.state[name].showValid ? validation.SUCCESS : validation.DEFAULT;
    const fieldStatus = isValid ? validStatus : validation.WARNING;

    this.setState({
      [name]: {
        ...this.state[name],
        ...{
          value: formattedValue,
          fieldStatus,
          valid: isValid,
          errorMessage: message,
        },
      },
    });

    // If the Password field has changed, we also need to check the confirm field
    if (name === 'password') {
      const [cpValid, cpStatus, cpMessage] = (value !== this.state.confirm_password.value) ?
        [false, validation.WARNING, 'Must match Password'] :
        [true, validation.SUCCESS, ''];
      this.setState({
        confirm_password: {
          ...this.state.confirm_password,
          ...{
            valid: cpValid,
            fieldStatus: cpStatus,
            errorMessage: cpMessage,
          },
        },
      });
    }
  }

  renderFieldError = (errorMessage) => (
    <div className="fieldError">
      <span>{errorMessage}</span>
    </div>
  )

  renderField = (fieldProps) => {
    switch (fieldProps.type) {
      case 'date':
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            {(this.state.formSubmitted &&
              this.state[fieldProps.name].errorMessage !== ''
              && this.renderFieldError(this.state[fieldProps.name].errorMessage))}
            <div
              className={
                `pt-input-group
                ${(this.state[fieldProps.name].fieldStatus !== undefined) ?
                  `pt-intent-${this.state[fieldProps.name].fieldStatus}` :
                  ''}`
                }
            >
              <DateInput
                maxDate={moment().toDate()}
                minDate={moment('1/1/1900', 'M/D/YYYY').toDate()}
                format={'MM/DD/YYYY'}
                id={fieldProps.name}
                name={fieldProps.name}
                popoverPosition={Position.TOP}
                openOnFocus={false}
                onChange={this.handleChange}
                onError={this.onDateError}
                invalidDateMessage={''}
                canClearSelection={false}
                value={this.state[fieldProps.name].value}
              />
            </div>
          </label>
        );

      case 'radio_group':
        return (
          <RadioGroup
            key={fieldProps.name}
            className={'form__radio'}
            id={fieldProps.name}
            name={fieldProps.name}
            selectedValue={this.state[fieldProps.name].value}
            onChange={this.handleChange}
          >
            {fieldProps.radios.map((radio) => (
              <Radio
                className="form__label-inline"
                key={radio.value}
                id={radio.value}
                label={radio.label}
                value={radio.value}
              />
            ))}
          </RadioGroup>
        );

      case 'text':
      case 'password':
      default:
        return (
          this.wrapInPopover(fieldProps.name,
            (<label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
              {fieldProps.label}
              {(this.state.formSubmitted &&
                this.state[fieldProps.name].errorMessage !== ''
                && this.renderFieldError(this.state[fieldProps.name].errorMessage))}
              <div className="pt-input-group">
                {(fieldProps.icon &&
                  <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>
                )}
                <input
                  className={
                    `pt-input
                    ${(this.state[fieldProps.name].fieldStatus !== undefined) ?
                      `pt-intent-${this.state[fieldProps.name].fieldStatus}` :
                      ''}`
                  }
                  id={fieldProps.name}
                  name={fieldProps.name}
                  type={fieldProps.type}
                  dir="auto"
                  onFocus={() =>
                    this.setState({
                      [fieldProps.name]: {
                        ...this.state[fieldProps.name],
                        ...{ popoverIsOpen: true },
                      },
                    })
                  }
                  onBlur={() =>
                    this.setState({
                      [fieldProps.name]: {
                        ...this.state[fieldProps.name],
                        ...{ popoverIsOpen: false },
                      },
                    })
                  }
                  onChange={this.handleChange}
                  value={this.state[fieldProps.name].value}
                />
                {(this.state.formSubmitted &&
                  this.state[fieldProps.name].errorMessage !== '' &&
                  <span className="pt-icon pt-icon-error fieldError"></span>)}
                {(this.state[fieldProps.name].fieldStatus === validation.SUCCESS &&
                  <span className="pt-icon pt-icon-tick fieldSuccess"></span>)}
              </div>
            </label>)
          )
        );
    }
  }

  render() {
    return (
      <div className="formContainer formLarge">
        <h1 className="formTitle">New User Registration</h1>
        <form onSubmit={this.submit} className="auth-form form-register">
          {fields.map(this.renderField)}
          <button
            className="pt-button pt-intent-primary form__submit-button"
            type="submit"
          >
            Register
          </button>
        </form>
        <div>
          <Dialog
            iconName="thumbs-up"
            isOpen={this.state.registrationSuccess}
            isCloseButtonShown={false}
            title="Registration Success"
          >
            <div className="pt-dialog-body">
              Welcome aboard! Let's get you <a href="/login">logged in.</a>
            </div>
          </Dialog>
        </div>
      </div>
    );
  }

}

export const Register = registerPage;
