import React from 'react';

import ReactChart from 'react-chartist';
import 'chartist/dist/chartist.min.css';

const data = {
  labels: ['2015', '2016'],
  series: [
    [1234, 2345],
  ],
};

const options = {
  high: 5000,
  low: 0,
};

const type = 'Bar';

const ReportChart = () => (
  <div className="reportChart">
    <ReactChart className={"reactChartContainer"} data={data} options={options} type={type} />
  </div>
);

ReportChart.propTypes = {
  config: React.PropTypes.object.isRequired,
  data: React.PropTypes.object.isRequired,
};

export default ReportChart;
