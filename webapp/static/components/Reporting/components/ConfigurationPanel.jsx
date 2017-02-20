import React from 'react';

const renderControlSet = (controlSet) => {
  if (controlSet.type === 'select') {
    return (
      <select id={`select_${controlSet.id}`} className="form-control">
        {controlSet.values.map((value, index) =>
          <option key={index}>{value}</option>
        )}
      </select>
    );
  } else if (controlSet.type === 'date') {
    return (
      <select id="date_select" className="form-control">
        <option>01/01/2016 - 12/31/2016</option>
      </select>
    );
  }
  return '';
};

// This Configuration Panel needs to be built from a default configuration
// document that describes the control sets and the options.
// We may need to have one of these specific to each Account/Data Set...
const ConfigurationPanel = (props) => (
  <div className="configPanel">
    {props.configOptions.ControlSets.map((controlSet) =>
      <div key={controlSet.id} className="configPanel__controlset">
        <label htmlFor={`select_${controlSet.id}`}>{controlSet.label}</label>
        {renderControlSet(controlSet)}
      </div>
    )}
  </div>
);

ConfigurationPanel.propTypes = {
  config: React.PropTypes.object.isRequired,
  configOptions: React.PropTypes.object.isRequired,
  datasetList: React.PropTypes.array.isRequired,
};

export default ConfigurationPanel;
