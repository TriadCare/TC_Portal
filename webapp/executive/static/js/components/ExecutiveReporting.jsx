import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';

import ReportingComponent from 'components/Reporting';

// import { refreshData } from '../ExecutiveActions';
import savedReport from '../saved_report.json'; // user pref doc
import reportControls from '../report_controls.json'; // user pref doc

// This function sums the values in the objects with the same key,
// then divides the sums by the length of the of the list.
const avgObj = (dataList) => {
  console.log(`List Length: ${dataList.length}`);
  const sumObj = dataList.reduce((acc, item) => {
    if (acc === undefined) {
      return item;
    }
    const newAcc = {};
    Object.keys(acc).forEach((key) => {
      newAcc[key] = acc[key] + item[key];
    });
    return newAcc;
  });

  const result = {};
  Object.keys(sumObj).forEach((key) => {
    result[key] = Math.round((sumObj[key] / dataList.length) * 100) / 100;
  });
  return result;
};

const getOptionValue = (optionName, controlObject) =>
  controlObject.controls[optionName].options.find(option =>
    option.id === controlObject.controls[optionName].selectedValue,
  ).value;

// This is the start of the Data Transformation for the Reporting Tool.
// Depending on the datasource and configuration, the data needs to take a
// certain format in order for the Victory Charts component to render.
// This function will be called everytime the user changes the configuration.
function buildChartData(datasources, controlObject) {
  const datasourceName = getOptionValue('data_set', controlObject);
  const chartType = getOptionValue('chart_type', controlObject);

  const dataItems = datasources[datasourceName].items;
  const reportData = [];

  switch (datasourceName) {
    case 'HRA':
      if (chartType === 'bar') {
        if (dataItems.length > 0) {
          Object.entries(
            // Average all of the score dictionaries into one
            avgObj(
              dataItems
              .filter(item => (
                moment(item.meta.DATE_CREATED).isSameOrAfter(controlObject.controls.date_range.min_date, 'day') &&
                moment(item.meta.DATE_CREATED).isSameOrBefore(controlObject.controls.date_range.max_date, 'day')
              ))
              .map(item => item.score),
            ),
          ).forEach(([k, v]) => {
            // Need one object for each bar in the bar chart
            reportData.push({ x: k, y: v });
          });
        }
      } else if (chartType === 'line') {
        if (dataItems.length > 0) {
          Object.entries(
            // Average all of the score dictionaries into one
            avgObj(dataItems.map(item => item.score)),
          ).forEach(([k, v]) => {
            // Need one object for each bar in the bar chart
            reportData.push({ x: k, y: v });
          });
        }
      }
      return { [chartType]: reportData };
    default:
      return { [chartType]: datasources[datasourceName] };
  }
}

// Should be built from selected datasource and configuration.
// Will need to be called everytime the user changes the
// configuration of the report.
function buildReport(datasources, controlObject) {
  const chartType = getOptionValue('chart_type', controlObject);
  return {
    meta: controlObject.reportMetaData,
    chart: {
      domainPadding: 20,
      animate: { duration: 1000 },
      style: {
        width: '100%',
        height: '100%',
        padding: '5px',
      },
    },
    independentAxis: {
      style: {
        tickLabels: {
          fontSize: 8,
          padding: 0,
          angle: -45,
        },
      },
    },
    dependentAxis: {
      dependentAxis: true,
      domain: [0, 4],
      tickCount: 4,
      tickFormat: y => `${(y * 100) / 4.0}%`,
    },
    [chartType]: {
      data: buildChartData(datasources, controlObject)[chartType],
      labels: datum => `${Math.trunc((datum.y * 100) / 4.0)}%`,
      style: {
        data: { width: 20 },
        labels: { fontSize: 8 },
      },
    },
  };
}

// To be used once by the constructor to load the controls into state.
function initControls(controlObj, report) {
  const { selectedControls, ...reportMetaData } = report;
  const controls = {};
  Object.entries(controlObj.Base.ControlSets).forEach(([key, control]) => {
    controls[key] = {
      ...control,
      ...{ selectedValue: selectedControls[key] },
    };
  });
  return { controls, reportMetaData };
}
const getSelectedDataName = configuration => configuration.controls.data_set.options.find(
    option => option.id === configuration.controls.data_set.selectedValue,
  ).value;

class ExecutiveReporting extends React.Component {
  constructor(props) {
    super(props);

    const controlObject = initControls(reportControls, savedReport);

    this.state = {
      isFetching: props.datasources[
        getSelectedDataName(controlObject)
      ].isFetching,
      report: buildReport(props.datasources, controlObject),
      controlObject,
    };
  }

  handleControlChange = (control, newValue) => {
    const newConfigObj = (control === 'date_range') ?
      { min_date: newValue[0], max_date: newValue[1] } :
      { selectedValue: newValue };

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
    console.log('rendering...');
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
};

const mapStateToProps = reduxStore => ({
  datasources: reduxStore.appState.datasources,
  // savedReports
});


export default connect(mapStateToProps)(ExecutiveReporting);
