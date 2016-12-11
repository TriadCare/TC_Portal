import React from 'react';
import moment from 'moment';
import { Position, RadioGroup, Radio } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

const fields = [
  {
    name: 'full_name',
    label: 'Full Name',
    type: 'text',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'text',
  },
  {
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
  },
  {
    name: 'employer',
    label: 'Employer',
    type: 'text',
  },
  {
    name: 'comment',
    label: 'Comment',
    type: 'textarea',
  },
];

class helpForm extends React.Component {
  constructor() {
    super();
    this.state = Object.assign(...fields.map(d => ({ [d.name]: '' })));
  }

  submit = (e) => {
    alert(`You submitted ${JSON.stringify(this.state)}`);
    e.preventDefault();
  }

  renderField = (fieldProps) => {
    let input;
    switch (fieldProps.type) {
      case 'date':
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            <div className="pt-input-group">
              <DateInput
                maxDate={moment().toDate()}
                minDate={moment('1/1/1900', 'M/D/YYYY').toDate()}
                format={'MM/DD/YYYY'}
                id={fieldProps.name}
                name={fieldProps.name}
                popoverPosition={Position.TOP}
                onChange={(d) => this.setState({
                  [fieldProps.name]: moment(d).format('YYYY-MM-DD'),
                })}
                value={this.state[fieldProps.name]}
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
            selectedValue={this.state[fieldProps.name]}
            onChange={(e) => this.setState({ [fieldProps.name]: e.target.value })}
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

      case 'textarea':
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            <div className="pt-input-group">
              {(fieldProps.icon && <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>)}
              <textarea
                className="pt-input pt-fill"
                id={fieldProps.name}
                name={fieldProps.name}
                type={fieldProps.type}
                dir="auto"
                onChange={(e) => this.setState({ [e.target.name]: e.target.value })}
                value={this.state[fieldProps.name]}
              />
            </div>
          </label>
        );

      case 'text':
      case 'password':
      default:
        return (
          <label htmlFor={fieldProps.name} key={fieldProps.name} className="form__label">
            {fieldProps.label}
            <div className="pt-input-group">
              {(fieldProps.icon && <span className={`pt-icon pt-icon-${fieldProps.icon}`}></span>)}
              <input
                className="pt-input"
                id={fieldProps.name}
                name={fieldProps.name}
                type={fieldProps.type}
                dir="auto"
                onChange={(e) => this.setState({ [e.target.name]: e.target.value })}
                value={this.state[fieldProps.name]}
              />
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
      </div>
    );
  }

}

export const GetHelp = helpForm;
