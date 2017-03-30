import React from 'react';
import { NonIdealState, Spinner } from '@blueprintjs/core';

import {
  VictoryChart, VictoryTheme, VictoryAxis,
  VictoryBar, VictoryPie, VictoryLine,
} from 'victory';

const getLoadingComponent = () => (
  <NonIdealState
    visual="info-sign"
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

const ReportChart = props => (
  <div className="reportElement reportChart">
    {props.isFetching ? '' : props.chartControl}
    <div className="reportChart__container">
      {props.isFetching ? getLoadingComponent() : renderChart(props.chartConfig)}
    </div>
  </div>
);

ReportChart.propTypes = {
  chartControl: React.PropTypes.element,
  chartConfig: React.PropTypes.shape().isRequired,
  isFetching: React.PropTypes.bool.isRequired,
};

export default ReportChart;
