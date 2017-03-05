import React from 'react';

const ReportTitle = props => (
  <div className="reportTitle">
    <div className="reportTitle__label">{props.label}</div>
    {
      // May want Dataset info with timestamp here... will need it in props.
      // Will want 'Save Report' button here.
    }
  </div>
);

ReportTitle.propTypes = {
  label: React.PropTypes.string.isRequired,
};

export default ReportTitle;
