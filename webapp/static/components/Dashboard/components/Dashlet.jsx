import React from 'react';
import moment from 'moment';

import DashChart from './DashChart';
import renderChart from 'components/Charting';

const renderDashChart = (config) => {
  if (config.chartist) {
    return renderChart(config.dataType, config.chartType, config.data);
  }

  return (
    <DashChart
      chartConfig={config}
      isFetching={config.data.length === 0}
    />
  );
};

const renderCard = (config, handleClick) => (
  <button
    className={
      `pt-card pt-elevation-0
      ${config.dataType !== 'trend' ? 'pt-interactive' : ''}
      dashlet__card`
    }
    onClick={() => handleClick(config)}
  >
    { /* header */ }
    <div className="dashlet__card-header">
      <div className="dashlet__card-title">
        {config.title}
      </div>
      <div className="dashlet__card-date">
        {config.data !== undefined &&
           config.data[0] !== undefined &&
            config.data[0].meta !== undefined &&
          moment(config.data[0].meta.DATE_CREATED).format('MMM Do, YYYY')}
      </div>
      <div className="dashlet__card-description">
        {config.description}
      </div>
    </div>
    { /* chart */ }
    {config.data !== undefined &&
      renderDashChart(config)
      }

  </button>
);

const Dashlet = props => renderCard(props.config, props.handleClick);

Dashlet.propTypes = {
  config: React.PropTypes.shape({
    data: React.PropTypes.array,
    title: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
  }),
  handleClick: React.PropTypes.func,
};

export default Dashlet;
