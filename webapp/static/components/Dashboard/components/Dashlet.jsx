import React from 'react';
// import moment from 'moment';

import DashChart from './DashChart';

const renderCard = (config, handleClick) => (
  <div
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
      { /*
      <div className="dashlet__card-date">
        {moment(config.data[0].meta.DATE_CREATED).format('MMM Do, YYYY')}
      </div>
      */ }
    </div>
    { /* body */ }
    <div className="dashlet__card-description">
      {config.description}
    </div>
    { /* chart */ }
    <DashChart
      chartConfig={config}
      isFetching={config.reportData === undefined || config.reportData.length === 0}
    />

  </div>
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
