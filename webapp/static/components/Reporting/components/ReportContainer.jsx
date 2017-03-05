import React from 'react';

import ReportTitle from './ReportTitle';
import ConfigurationPanel from './ConfigurationPanel';
import ReportChart from './ReportChart';

const ReportContainer = props => (
  <div className="reportContainer">
    <ReportTitle label={props.report.meta.label} />
    <ConfigurationPanel
      controlOptions={props.controls}
      handleControlChange={props.handleControlChange}
    />
    {/* config should be some kind of combination
      of the config options and the selected option. */}
    <ReportChart
      chartConfig={props.report}
    />
  </div>
);

ReportContainer.propTypes = {
  report: React.PropTypes.shape().isRequired,
  controls: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ReportContainer;
