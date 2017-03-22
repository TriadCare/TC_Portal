import React from 'react';
import { Button } from '@blueprintjs/core';

import ReportTitle from './ReportTitle';
import ConfigurationPanel from './ConfigurationPanel';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';


const ReportContainer = props => (
  <div className="reportContainer">
    <div className="reportHeader">
      <ReportTitle label={props.report.meta.label} />
      <div className="reportToolbar">
        <Button
          iconName="download"
          className="pt-large pt-minimal reportToolbar__button"
          onClick={e => console.log(e.target)}
        />
      </div>
    </div>
    <ConfigurationPanel
      controlOptions={props.controls}
      handleControlChange={props.handleControlChange}
    />
    <ReportChart
      chartConfig={props.report}
      isFetching={
        props.isFetching ||
        props.report.reportData === undefined ||
        props.report.reportData.length === 0
      }
    />
    <ReportTable
      isFetching={props.isFetching}
      data={props.report.reportData || []}
    />
  </div>
);

ReportContainer.propTypes = {
  isFetching: React.PropTypes.bool.isRequired,
  report: React.PropTypes.shape().isRequired,
  controls: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ReportContainer;
