import React from 'react';
import moment from 'moment';
import { Position, Dialog } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { validation, validateEmail, submitHelpRequest } from '../util.js';


const fields = [
  {
    name: 'full_name',
    label: 'Full Name',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'Your Name is required.'),
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
        message = 'Your Email is required.';
      } else {
        isValid = validateEmail(value);
        message = isValid ? '' : 'This email address is invalid.';
      }

      return [value, isValid, message];
    },
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'Your Phone Number is required.'),
    ],
  },
  {
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
    validationFunction: (value) =>
      [
        (value ? moment(value).format('YYYY-MM-DD') : ''),
        !!value,
        (!!value ? '' : 'Your Date of Birth is required.'),
      ],
  },
  {
    name: 'employer',
    label: 'Employer',
    type: 'text',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'The Name of your Employer is required.'),
    ],
  },
  {
    name: 'comment',
    label: 'Comment',
    type: 'textarea',
    validationFunction: (value) => [
      value,
      !!value,
      (!!value ? '' : 'A description is required.'),
    ],
  },
];

class helpForm extends React.Component {
  constructor() {
    super();
    this.state = Object.assign(
      { formSubmitted: false, submissionSuccess: false },
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
      })));
  }

  onDateError = (date) => (
    date || moment().format('YYYY-MM-DD')
  )

  submissionSuccess = () => {
    this.setState({ submissionSuccess: true });
  }

  submissionFailure = (error) => {
    switch (error.code) {
      default:
        this.setState({
          full_name: {
            ...this.state.full_name,
            fieldStatus: validation.ERROR,
            valid: false,
            errorMessage: 'Oops! Someting went wrong.',
          },
        });
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
        submitHelpRequest(Object.assign({},
          ...fields.map(field => ({
            [field.name]: this.state[field.name].value,
          }))
        ), this.submissionSuccess, this.submissionFailure);
      }
    });
  }

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
  }

  renderFieldError = (errorMessage) => (
    <div className="fieldError">
      <span>{errorMessage}</span>
    </div>
  )

  renderField = (fieldProps) => {
    let input;
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

      case 'textarea':
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            {(this.state.formSubmitted &&
              this.state[fieldProps.name].errorMessage !== ''
              && this.renderFieldError(this.state[fieldProps.name].errorMessage))}
            <div className="pt-input-group">
              {(fieldProps.icon && <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>)}
              <textarea
                className={
                  `pt-input pt-fill
                  ${(this.state[fieldProps.name].fieldStatus !== undefined) ?
                    `pt-intent-${this.state[fieldProps.name].fieldStatus}` :
                    ''}`
                }
                id={fieldProps.name}
                name={fieldProps.name}
                type={fieldProps.type}
                dir="auto"
                onChange={this.handleChange}
                value={this.state[fieldProps.name].value}
              />
            </div>
          </label>
        );

      case 'text':
      default:
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            {(this.state.formSubmitted &&
              this.state[fieldProps.name].errorMessage !== ''
              && this.renderFieldError(this.state[fieldProps.name].errorMessage))}
            <div className="pt-input-group">
              {(fieldProps.icon && <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>)}
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
                onChange={this.handleChange}
                value={this.state[fieldProps.name].value}
              />
              {(this.state.formSubmitted &&
                this.state[fieldProps.name].errorMessage !== '' &&
                <span className="pt-icon pt-icon-error fieldError"></span>)}
              {(this.state[fieldProps.name].fieldStatus === validation.SUCCESS &&
                <span className="pt-icon pt-icon-tick fieldSuccess"></span>)}
            </div>
          </label>
        );
    }
  }

  render() {
    return (
      <div className="formContainer formLarge">
        <h1 className="formTitle">Contact Support</h1>
        <form onSubmit={this.submit} className="auth-form form-help">
          {fields.map(this.renderField)}
          <button
            className="pt-button pt-intent-primary form__submit-button"
            type="submit"
          >
            Request Help
          </button>
        </form>
        <div className="form__footer">
          <p className="form__description">Give us the details and we'll give you the help.</p>
        </div>
        <div>
          <Dialog
            iconName="thumbs-up"
            isOpen={this.state.submissionSuccess}
            isCloseButtonShown={false}
            title="Help is on the way!"
          >
            <div className="pt-dialog-body">
              <p>Your Help Request has successfully been submitted.</p>
              <p>Check your email for a request ticket.</p>
              <p>If you don't get one after a while, you might want to give
              us a call. (866) 885-7931</p>
            </div>
          </Dialog>
        </div>
      </div>
    );
  }

}

export const GetHelp = helpForm;
