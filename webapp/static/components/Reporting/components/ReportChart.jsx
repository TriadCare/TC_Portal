import React from 'react';

import {
  VictoryChart, VictoryTheme, VictoryAxis,
  VictoryBar, VictoryPie, VictoryLine,
} from 'victory';

const ReportChart = props => (
  <div className="reportChart">
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
          <VictoryBar {...props.chartConfig.bar} /> }
        { /* Line Chart */ }
        { props.chartConfig.line !== undefined &&
          <VictoryLine {...props.chartConfig.line} /> }
      </VictoryChart>
    }
  </div>
);

ReportChart.propTypes = {
  chartConfig: React.PropTypes.shape().isRequired,
};

export default ReportChart;
