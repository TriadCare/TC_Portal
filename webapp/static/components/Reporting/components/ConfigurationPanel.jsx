import moment from 'moment';
import React from 'react';
// import { DateInput } from '@blueprintjs/datetime';
// import { Position } from '@blueprintjs/core';

const renderControlSet = (controlName, controlSet, handleControlChange) => {
  switch (controlSet.type) {
    case 'datafilter':
    case 'select':
      return (
        <select
          id={`select_${controlName}`}
          className="form-control"
          value={controlSet.selectedValue}
          onChange={e => handleControlChange(controlName, parseInt(e.target.value, 10))}
        >
          {controlSet.type === 'datafilter' &&
            <option
              key={0}
              value={undefined}
            >
              Show All
            </option>
          }
          {controlSet.options.map(option =>
            <option
              key={option.id}
              value={option.id}
            >
              {option.label}
            </option>,
          )}
        </select>
      );
    case 'date':
      return (
        <div
          className="pt-input-group"
        >
          <input
            type="text"
            className="pt-input pt-fill"
            value={
              `${
                moment(controlSet.min_date).format('MM/D/YYYY')
              }>${
                moment(controlSet.max_date).format('MM/D/YYYY')
              }`
            }
            onChange={(e) => {
              const dateRange = e.target.value.split('>');
              if (!moment(dateRange[0]).isValid() || !moment(dateRange[1]).isValid()) {
                console.log('Invalid Date');
                return;
              }
              const minDate = moment(dateRange[0]);
              const maxDate = moment(dateRange[1]);
              handleControlChange(controlName, [minDate, maxDate]);
            }}
          />
        </div>
      );
    default:
      return '';
  }
};

// This Configuration Panel needs to be built from a default configuration
// document that describes the control sets and the options.
// We may need to have one of these specific to each Account/Data Set...
const ConfigurationPanel = props => (
  <div className="configPanel">
    {Object.keys(props.controlOptions).map(key =>
      <div key={key} className="configPanel__controlset">
        <label htmlFor={`select_${key}`}>{props.controlOptions[key].label}</label>
        {renderControlSet(key, props.controlOptions[key], props.handleControlChange)}
      </div>,
    )}
  </div>
);

ConfigurationPanel.propTypes = {
  controlOptions: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ConfigurationPanel;
