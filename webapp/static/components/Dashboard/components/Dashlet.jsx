import React from 'react';
import moment from 'moment';
import Chartist from 'chartist';
import ChartistGraph from 'react-chartist';

const renderChart = (dataType, chartType, data) => {
  switch (dataType) {
    case 'point':
      return (
        <ChartistGraph
          data={{
            series: [
              {
                value: data[0].score.Overall,
                className: 'chart-series-a chart__donut-overall',
              },
              {
                value: (4 - data[0].score.Overall),
                className: 'chart-series-b chart__donut-remainder',
              },
            ],
          }}
          options={{
            labelInterpolationFnc: (label) => `${
              Math.round(label * 100 / 4)
            }%`,
            donut: true,
            donutWidth: 35,
          }}
          type={chartType}
          className="ct-chart"
          listener={{
            draw: (ctx) => {
              if (ctx.type === 'label') {
                if (ctx.index === 0) {
                  ctx.element.addClass('chart__donut-label');
                  ctx.element.attr({
                    dx: ctx.element.root().width() / 2,
                    dy: ctx.element.root().height() / 2,
                  });
                } else {
                  ctx.element.remove();
                }
              }
              if (ctx.type === 'slice') {
                // Get the total path length in order to use for dash array animation
                const pathLength = ctx.element._node.getTotalLength();

                // Set a dasharray that matches the path length
                // as prerequisite to animate dashoffset
                ctx.element.attr({
                  'stroke-dasharray': `${pathLength}px ${pathLength}px`,
                });

                // Create animation definition while also assigning an
                // ID to the animation for later sync usage
                const animationDefinition = {
                  'stroke-dashoffset': {
                    id: `anim${ctx.index}`,
                    dur: 1000,
                    from: `${-pathLength}px`,
                    to: '0px',
                    easing: Chartist.Svg.Easing.easeOutQuint,
                    // We need to use `fill: 'freeze'` otherwise
                    // our animation will fall back to initial (not visible)
                    fill: 'freeze',
                  },
                };

                // If this was not the first slice, we need to time
                // the animation so that it uses the end sync event of the previous animation
                if (ctx.index !== 0) {
                  animationDefinition['stroke-dashoffset'].begin = `anim${ctx.index - 1}.end`;
                }

                // We need to set an initial value before the animation
                // starts as we are not in guided mode which would do that for us
                ctx.element.attr({
                  'stroke-dashoffset': `${-pathLength}px`,
                });

                // We can't use guided mode as the animations need to rely on setting begin manually
                // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
                ctx.element.animate(animationDefinition, false);
              }
            },
          }}
        />
      );

    case 'trend':
      return (
        <ChartistGraph
          data={{
            series: [
              {
                data: data.map((d) => ({
                  x: new Date(d.meta.DATE_CREATED),
                  y: (d.score.Overall * 100 / 4),
                })),
              },
            ],
          }}
          options={{
            showArea: true,
            axisX: {
              type: Chartist.FixedScaleAxis,
              divisor: 5,
              labelInterpolationFnc: (value) => moment(value).format('MMM YYYY'),
            },
            axisY: {
              low: 0,
              high: 100,
              onlyInteger: true,
            },
            width: '100%',
            height: '100%',
            classNames: {
              label: 'ct-label dashlet__chart-label',
              series: 'ct-series',
              line: 'ct-line dashlet__chart-line',
              point: 'ct-point dashlet__chart-point',
              area: 'ct-area dashlet__chart-area',
            },
          }}
          listener={{
            draw: (ctx) => {
              if (ctx.type === 'line' || ctx.type === 'area') {
                ctx.element.animate({
                  d: {
                    begin: 2000 * ctx.index,
                    dur: 2000,
                    from: ctx.path.clone().scale(1, 0)
                      .translate(0, ctx.chartRect.height())
                      .stringify(),
                    to: ctx.path.clone().stringify(),
                    easing: Chartist.Svg.Easing.easeOutQuint,
                  },
                });
              }
              if (ctx.type === 'point') {
                const scoreLabel = new Chartist.Svg('text');
                scoreLabel.text(Math.round(ctx.series.data[ctx.index].y));
                scoreLabel.addClass('chart__point-label');
                scoreLabel.attr({
                  x: (ctx.x + (ctx.element.width() * 0.5)),
                  y: (ctx.y + (ctx.element.height() * -1) - 10),
                  'text-anchor': 'middle',
                });
                ctx.group.append(scoreLabel);
              }
            },
          }}
          type={chartType}
          className="ct-chart dashlet__chart"
        />
        );

    default:
      return '';
  }
};

const Dashlet = (props) => (
  <div
    className={
      `pt-card pt-elevation-0
      ${props.config.dataType !== 'trend' ? 'pt-interactive' : ''}
      dashlet__card`
    }
    onClick={props.handleClick}
  >
    <div className="dashlet__card-header">
      <div className="dashlet__card-title">{props.config.title}</div>
      {(props.config.dataType === 'trend') ? '' :
        <div className="dashlet__card-date">
          {moment(props.config.data[0].meta.DATE_CREATED).format('MMM Do, YYYY')}
        </div>}
    </div>
    {/* <div className="dashlet__card-description">{props.config.description}</div> */}
    {renderChart(props.config.dataType, props.config.chartType, props.config.data)}
  </div>
);

Dashlet.propTypes = {
  config: React.PropTypes.shape({
    data: React.PropTypes.array.isRequired,
    title: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
    dataType: React.PropTypes.string.isRequired,
    chartType: React.PropTypes.string.isRequired,
  }),
  handleClick: React.PropTypes.func,
};

export default Dashlet;
