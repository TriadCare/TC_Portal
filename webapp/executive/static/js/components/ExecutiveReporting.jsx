
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

  const chartControls = {};
  Object.entries(controlObj.Chart).forEach(([key, control]) => {
    chartControls[key] = {
      ...control,
      ...{ selectedValue: selectedControls[key] },
    };
  });

  // Add controls specfic to the dataset
  const dataControls = controlObj.Data[getSelectedDataName(
    { Base: baseControls },
  )];

  const combinedControls = {
    Base: baseControls,
    Chart: chartControls,
    Data: dataControls,
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
        getSelectedDataName(controlObject.controls)
      ].isFetching,
      report: buildReport(props.datasources, controlObject),
      controlObject,
    };
  }

  getFiltereredControls = () => (
    // filter the data sets if no relevant data
    {
      ...this.state.controlObject.controls,
      ...{
        Base: {
          ...this.state.controlObject.controls.Base,
          ...{
            data_set: {
              ...this.state.controlObject.controls.Base.data_set,
              ...{
                options: this.state.controlObject.controls.Base.data_set.options.filter(option =>
                  (this.props.datasources[option.value] !== undefined &&  // data object exists
                    this.props.datasources[option.value].isFetching !== true &&  // is not fetching
                    this.props.datasources[option.value].items.length !== 0),  // and has data
                ),
              },
            },
          },
        },
      },
    }
  );

  isFetching = () => {
    const datasourceName = getSelectedDataName(this.getFiltereredControls());
    if (datasourceName === undefined) { return true; }
    return this.props.datasources[datasourceName].isFetching;
  }

  handleControlChange = (controlSet, control, value) => {
    const newConfigObj = (control === 'date_range') ?
      { min_date: value[0], max_date: value[1] } :
      { selectedValue: value !== '0' ? parseInt(value, 10) : undefined };

    // Check if any other controls depend on this one.
    const resetControls = {};
    Object.keys(this.state.controlObject.controls[controlSet]).filter(k =>
      this.state.controlObject.controls[controlSet][k].childOf === control,
    ).forEach((controlKey) => {
      resetControls[controlKey] = {
        ...this.state.controlObject.controls[controlSet][controlKey],
        ...{ selectedValue: undefined },
      };
    });
    this.setState({
      controlObject: {
        ...this.state.controlObject,
        ...{
          controls: {
            ...this.state.controlObject.controls,
            ...{
              [controlSet]: {
                ...this.state.controlObject.controls[controlSet],
                ...{
                  [control]: {
                    ...this.state.controlObject.controls[controlSet][control],
                    ...newConfigObj,
                  },
                },
                ...resetControls,
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
        isFetching={this.isFetching()}
        report={buildReport(this.props.datasources, this.state.controlObject)}
        controls={this.getFiltereredControls()}
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
