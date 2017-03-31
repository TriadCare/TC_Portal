import React from 'react';
import { NonIdealState, Spinner } from '@blueprintjs/core';

import {
  VictoryChart, VictoryTheme, VictoryAxis,
  VictoryBar, VictoryPie, VictoryLine,
} from 'victory';

const getLoadingComponent = () => (
  <NonIdealState
    title="Processing Data"
    description={'Shouldn\'t take much longer...'}
    action={<Spinner />}
  />
);

const renderChart = chartConfig => (
  /* Pie Chart */
  (chartConfig.pie !== undefined ?
    <VictoryPie {...chartConfig.pie} /> :
    <VictoryChart theme={VictoryTheme.material} {...chartConfig.chart}>
      { /* Axes  */}
      { chartConfig.independentAxis !== undefined &&
        <VictoryAxis {...chartConfig.independentAxis} /> }
      { chartConfig.dependentAxis !== undefined &&
        <VictoryAxis {...chartConfig.dependentAxis} /> }
      { /* Bar Chart */ }
      { chartConfig.bar !== undefined &&
        <VictoryBar theme={VictoryTheme.material} {...chartConfig.bar} /> }
      { /* Line Chart */ }
      { chartConfig.line !== undefined &&
        <VictoryLine {...chartConfig.line} /> }
    </VictoryChart>
  )
);

const DashChart = props => (
  <div className="dashChart">
    {props.isFetching ? getLoadingComponent() : renderChart(props.chartConfig)}
  </div>
);

DashChart.propTypes = {
  chartConfig: React.PropTypes.shape().isRequired,
  isFetching: React.PropTypes.bool.isRequired,
};

export default DashChart;
