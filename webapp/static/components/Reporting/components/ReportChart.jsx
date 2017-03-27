import React from 'react';
import { NonIdealState, Spinner } from '@blueprintjs/core';

import {
  VictoryChart, VictoryTheme, VictoryAxis,
  VictoryBar, VictoryPie, VictoryLine,
} from 'victory';

const getLoadingComponent = () => (
  <NonIdealState
    visual="cloud-download"
    title="Fetching Report"
    description={'Hang tight while we set this up...'}
    action={<Spinner />}
  />
);

const ReportChart = props => (
  (props.isFetching ? getLoadingComponent() :
  <div className="reportElement reportChart">
    { /* Pie Chart */ }
    { props.chartConfig.pie !== undefined ?
      <VictoryPie {...props.chartConfig.pie} /> :
      <VictoryChart theme={VictoryTheme.material} {...props.chartConfig.chart}>
        { /* Axes  */}
        { props.chartConfig.independentAxis !== undefined &&
          <VictoryAxis {...props.chartConfig.independentAxis} /> }
        { props.chartConfig.dependentAxis !== undefined &&
          <VictoryAxis {...props.chartConfig.dependentAxis} /> }
        { /* Bar Chart */ }
        { props.chartConfig.bar !== undefined &&
          <VictoryBar theme={VictoryTheme.material} {...props.chartConfig.bar} /> }
        { /* Line Chart */ }
        { props.chartConfig.line !== undefined &&
          <VictoryLine {...props.chartConfig.line} /> }
      </VictoryChart>
    }
  </div>
));

ReportChart.propTypes = {
  chartConfig: React.PropTypes.shape().isRequired,
  isFetching: React.PropTypes.bool.isRequired,
};

export default ReportChart;
