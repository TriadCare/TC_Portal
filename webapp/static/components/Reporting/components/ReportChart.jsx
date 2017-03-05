import React from 'react';

import {
  VictoryChart, VictoryTheme, VictoryAxis,
  VictoryBar, VictoryPie, VictoryLine,
} from 'victory';

const ReportChart = props => (
  <div className="reportChart">
    <VictoryChart theme={VictoryTheme.material} {...props.chartConfig.chart}>
      <VictoryAxis {...props.chartConfig.independentAxis} />
      <VictoryAxis {...props.chartConfig.dependentAxis} />
      { props.chartConfig.bar !== undefined ?
        <VictoryBar
          {...props.chartConfig.bar}
        /> : null
      }
      { props.chartConfig.pie !== undefined ?
        <VictoryPie
          {...props.chartConfig.pie}
        /> : null
      }
      {props.chartConfig.line !== undefined ?
        <VictoryLine
          {...props.chartConfig.line}
        /> : null
      }
    </VictoryChart>
  </div>
);

ReportChart.propTypes = {
  chartConfig: React.PropTypes.shape().isRequired,
};

export default ReportChart;
