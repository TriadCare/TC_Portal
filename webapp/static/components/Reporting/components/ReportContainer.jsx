import React from 'react';

import ReportTitle from './ReportTitle';
import ConfigurationPanel from './ConfigurationPanel';
import ReportChart from './ReportChart';

const ReportContainer = (props) => (
  <div className="reportContainer">
    <ReportTitle label={props.reportLabel} />
    <ConfigurationPanel
      config={props.reportConfig}
      configOptions={props.configOptions}
      datasetList={props.datasetList}
    />
    <ReportChart
      config={props.reportConfig}
      data={props.dataset}
    />
  </div>
);

ReportContainer.propTypes = {
  reportLabel: React.PropTypes.string.isRequired,
  reportConfig: React.PropTypes.object.isRequired,
  configOptions: React.PropTypes.object.isRequired,
  dataset: React.PropTypes.object.isRequired,
  datasetList: React.PropTypes.array.isRequired,
};

export default ReportContainer;
