import React from 'react';
import moment from 'moment';

import DashChart from './DashChart';
import renderChart from 'components/Charting';

const renderDashChart = (config) => {
  if (config.chartist) {
    return renderChart(config.dataType, config.chartType, config.data, 'dashlet__chart');
  }

  return (
    <DashChart
      chartConfig={config}
      isFetching={config.data.length === 0}
    />
  );
};

const renderTableCard = (config) => (
  <div className="pt-card pt-elevation-0 dashlet__card">
    { /* header */ }
    <div className="dashTable__row dashlet__card-tableheader">
      <div className="dashlet__card-title">{config.data[0].label}</div>
      <div className="dashTable__row-spacer"></div>
      <div className={`dashlet__card-info grade-${config.data[0].risk.grade}`}>
        <div className="dashTable__row-grade">{config.data[0].risk.grade}</div>
        <div className="dashTable__row-risk">{config.data[0].risk.risk}</div>
      </div>
    </div>
    { /* table */ }
    <div className="dashTable">
      {config.data[0].components.map(component =>
        <div key={`table-row-${component.label}`} className="dashTable__row">
          <div className="dashTable__row-label">{component.label}</div>
          {component.value ?
            <div className="dashTable__row-value">
              {component.value} <span className="unitLabel">{component.units}</span>
            </div>
            : <span>–</span>
          }
          <div className={`dashlet__card-info grade-${component.grade}`}>
            <div className="dashTable__row-grade">{component.grade}</div>
            <div className="dashTable__row-risk">{component.risk}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

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
        {(config.dataType === "trend" ||
          (config.data !== undefined && config.data.length !== 0 && config.data[0].meta !== undefined && config.data[0].meta.completed === 1)) ?
          config.title : (config.data !== undefined && "Incomplete HRA") }
        <div className="dashlet__card-date">
          {config.data !== undefined &&
             config.data[0] !== undefined &&
              config.data[0].meta !== undefined &&
            moment(config.data[0].meta.DATE_CREATED).format('MMM Do, YYYY')}
        </div>
      </div>
      <div className="dashlet__card-description">
        {config.description}
      </div>
    </div>
    { /* chart */ }
    {(config.dataType === "trend" ||
        (config.data !== undefined && config.data.length !== 0 && config.data[0].meta !== undefined && config.data[0].meta.completed === 1)) ?
      renderDashChart(config) : (config.data !== undefined && <div className="incomplete-hra-contents">Click to Continue</div>) }
  </button>
);

const Dashlet = props => props.config.dataType === "table" ?
  renderTableCard(props.config)
  : renderCard(props.config, props.handleClick);

Dashlet.propTypes = {
  config: React.PropTypes.shape({
    data: React.PropTypes.array,
    title: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
  }),
  handleClick: React.PropTypes.func,
};

export default Dashlet;
