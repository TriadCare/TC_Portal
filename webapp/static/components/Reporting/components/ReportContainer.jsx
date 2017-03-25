import React from 'react';
import { Button } from '@blueprintjs/core';

import ReportTitle from './ReportTitle';
import ConfigurationPanel from './ConfigurationPanel';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';

import DownloadCSV from 'components/DownloadCSV';


class ReportContainer extends React.Component {
  constructor() {
    super();
    this.state = { shouldRenderCSVDownload: false };
  }

  render() {
    return (
      <div id="reportContainer" className="reportContainer">
        <div className="reportHeader">
          <ReportTitle label={this.props.report.meta.label} />
          <div className="reportToolbar">
            <Button
              iconName="download"
              className="pt-large pt-minimal reportToolbar__button"
              onClick={() => this.setState({ shouldRenderCSVDownload: true })}
            />
          </div>
        </div>
        <ConfigurationPanel
          controlOptions={this.props.controls}
          handleControlChange={this.props.handleControlChange}
        />
        <ReportChart
          chartConfig={this.props.report}
          isFetching={
            this.props.isFetching ||
            this.props.report.reportData === undefined ||
            this.props.report.reportData.length === 0
          }
        />
        <ReportTable
          isFetching={this.props.isFetching}
          data={this.props.report.reportData || []}
          columnDef={this.props.report.columnDef || []}
        />
        {this.state.shouldRenderCSVDownload &&
          <DownloadCSV
            data={this.props.report.reportData}
            callback={() => this.setState({ shouldRenderCSVDownload: false })}
          />
        }
      </div>
    );
  }
}

ReportContainer.propTypes = {
  isFetching: React.PropTypes.bool.isRequired,
  report: React.PropTypes.shape().isRequired,
  controls: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ReportContainer;
