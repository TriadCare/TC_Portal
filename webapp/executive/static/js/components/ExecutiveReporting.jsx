
import React from 'react';
import { connect } from 'react-redux';

import { buildReport, getSelectedDataName } from '../ExecutiveDataTransform';
import ReportingComponent from 'components/Reporting';

// import { refreshData } from '../ExecutiveActions';
import savedReport from '../saved_report.json'; // user pref doc
import reportControls from '../report_controls.json'; // user pref doc


// To be used once by the constructor to load the controls into state.
function initControls(controlObj, report) {
  const { selectedControls, ...reportMetaData } = report;
  const baseControls = {};
  Object.entries(controlObj.Base).forEach(([key, control]) => {
    baseControls[key] = {
      ...control,
      ...{ selectedValue: selectedControls[key] },
    };
  });
  // Add controls specfic to the dataset
  const dataControls = controlObj.Data[getSelectedDataName({ controls: baseControls })];
  const combinedControls = {
    ...baseControls,
    ...dataControls,
  };
  return { controls: combinedControls, reportMetaData };
}

class ExecutiveReporting extends React.Component {
  constructor(props) {
    super(props);

    if (props.selectedConfig) {
      console.log(props.selectedConfig.title);
    }

    const controlObject = initControls(reportControls, savedReport);

    this.state = {
      isFetching: props.datasources[
        getSelectedDataName(controlObject)
      ].isFetching,
      report: buildReport(props.datasources, controlObject),
      controlObject,
    };
  }

  handleControlChange = (control, value) => {
    const newConfigObj = (control === 'date_range') ?
      { min_date: value[0], max_date: value[1] } :
      { selectedValue: value !== '0' ? parseInt(value, 10) : undefined };

    this.setState({
      controlObject: {
        ...this.state.controlObject,
        ...{
          controls: {
            ...this.state.controlObject.controls,
            ...{
              [control]: {
                ...this.state.controlObject.controls[control],
                ...newConfigObj,
              },
            },
          },
        },
      },
    });
  }

  render() {
    return (
      <ReportingComponent
        isFetching={
          this.props.datasources[
            getSelectedDataName(this.state.controlObject)
          ].isFetching}
        report={buildReport(this.props.datasources, this.state.controlObject)}
        controls={this.state.controlObject.controls}
        handleControlChange={this.handleControlChange}
      />
    );
  }
}

ExecutiveReporting.propTypes = {
  datasources: React.PropTypes.shape().isRequired,
  selectedConfig: React.PropTypes.shape(),
};

ExecutiveReporting.defaultProps = {
  selectedConfig: {},
};

const mapStateToProps = reduxStore => ({
  datasources: reduxStore.appState.datasources,
  selectedConfig: reduxStore.appState.selectedConfig,
  // savedReports
});


export default connect(mapStateToProps)(ExecutiveReporting);
