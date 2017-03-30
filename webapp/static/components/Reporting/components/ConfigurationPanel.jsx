import moment from 'moment';
import React from 'react';
import { DateRangeInput } from '@blueprintjs/datetime';

const renderControlSet = (controlName, controlSet, handleControlChange) => {
  switch (controlSet.type) {
    case 'datafilter':
    case 'select':
      return (
        <div className="pt-minimal pt-select">
          <select
            id={`select_${controlName}`}
            className="form-control"
            value={controlSet.selectedValue || 0}
            onChange={e => handleControlChange(controlName, e.target.value)}
          >
            {controlSet.type === 'datafilter' &&
              <option
                key={0}
                value={0}
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
        </div>
      );
    case 'date':
      return (
        <DateRangeInput
          value={[
            (controlSet.min_date === null ?
              null : moment(controlSet.min_date).format('MM/D/YYYY')),
            (controlSet.max_date === null ?
              null : moment(controlSet.max_date).format('MM/D/YYYY')),
          ]}
          onChange={(dateRange) => {
            handleControlChange(controlName, dateRange);
          }}
          format={'MM/D/YYYY'}
          className="dateRange__container"
          endInputProps={{ className: 'form-control-container' }}
          startInputProps={{ className: 'form-control-container' }}
        />
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
        (props.controlOptions[key].options === undefined ||
        props.controlOptions[key].options.length > 1) &&
        <div key={key} className="configPanel__controlset">
          <label htmlFor={`select_${key}`} className="pt-label">
            {props.controlOptions[key].label}
            {renderControlSet(key, props.controlOptions[key], props.handleControlChange)}
          </label>
        </div>,
    )}
  </div>
);

ConfigurationPanel.propTypes = {
  controlOptions: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ConfigurationPanel;
