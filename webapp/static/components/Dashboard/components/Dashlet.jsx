import React from 'react';
import moment from 'moment';

import renderChart from 'components/Charting';

const renderCard = (config, handleClick) => {
  const newHRA = config.data === undefined;
  const incompleteHRA = (
    config.dataType === 'point' &&
    config.data[0].meta &&
    config.data[0].meta.completed === 0
  );
  const trendCard = config.dataType === 'trend';
  const pointCard = (config.dataType === 'point' && !(newHRA || incompleteHRA || trendCard));
  const foldCard = config.cardType === 'fold';

  return (
    <div
      className={
        `pt-card pt-elevation-0
        ${config.dataType !== 'trend' ? 'pt-interactive' : ''}
        dashlet__card`
      }
      onClick={handleClick}
    >
      { /* header */ }
      <div className="dashlet__card-header">
        <div className="dashlet__card-title">
          {incompleteHRA ? 'Incomplete HRA' : config.title}
        </div>
        {(!foldCard && (incompleteHRA || pointCard)) &&
          <div className="dashlet__card-date">
            {moment(config.data[0].meta.DATE_CREATED).format('MMM Do, YYYY')}
          </div>
        }
      </div>
      { /* body */ }
      {(newHRA || incompleteHRA) &&
        <div className="dashlet__card-description">
          {incompleteHRA ? 'Click here to continue this HRA.' : config.description}
        </div>
      }
      { /* chart */ }
      {(trendCard || pointCard || foldCard) &&
        renderChart(config.dataType, config.chartType, config.data)
      }

    </div>
  );
};

const Dashlet = props => renderCard(props.config, props.handleClick);

Dashlet.propTypes = {
  config: React.PropTypes.shape({
    data: React.PropTypes.array,
    title: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
    dataType: React.PropTypes.string,
    chartType: React.PropTypes.string,
  }),
  handleClick: React.PropTypes.func,
};

export default Dashlet;
