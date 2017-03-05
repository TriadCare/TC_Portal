import React from 'react';
import moment from 'moment';
import Chartist from 'chartist';
import ChartistGraph from 'react-chartist';

const scrollTo = (element, to, duration) => {
  if (duration <= 0) return;
  const difference = to - element.scrollTop;
  const perTick = (difference / duration) * 10;

  setTimeout(() => {
    /* eslint no-param-reassign: ["error", { "props": false }]*/
    element.scrollTop += perTick;
    if (element.scrollTop === to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
};

const pie = (chartType, data, classNames) => (
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
      labelInterpolationFnc: label => `${
        Math.round((label * 100) / 4)
      }%`,
      donut: true,
      donutWidth: 35,
    }}
    type={chartType}
    className={classNames}
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
          /* eslint-disable no-underscore-dangle */
          const pathLength = ctx.element._node.getTotalLength();
          /* eslint-enable */

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

// HRA specific... remove ASAP...
const getSection = (k) => {
  const map = {
    'Diet & Nutrition': 3,
    'Physical Activity': 4,
    'Preventative Care': 7,
    Stress: 5,
    Tobacco: 2,
  };
  return map[k];
};

const bar = (chartType, data, classNames) => (
  <ChartistGraph
    data={{
      labels: Object.keys(data[0].score).filter(k => k !== 'Overall'),
      series: data.map(d =>
        Object.keys(d.score)
        .filter(k => k !== 'Overall')
        .map(k => ({
          value: Math.round((d.score[k] * 100) / 4),
          meta: getSection(k),
        })),
      ),
    }}
    options={{
      axisY: {
        low: 0,
        high: 100,
        onlyInteger: true,
      },
      seriesBarDistance: 35,
      width: '100%',
      height: '100%',
      classNames: {
        label: 'ct-label response__chart-label',
        bar: 'ct-bar chart-bar',
      },
    }}
    responsiveOptions={[
      ['screen and (max-width: 450px)', {
        seriesBarDistance: 20,
      }],
    ]}
    type={chartType}
    className={classNames}
    listener={{
      draw: (ctx) => {
        if (ctx.type === 'bar') {
          /* eslint no-param-reassign: ["error", { "props": false }]*/
          /* eslint no-underscore-dangle: ["error", { "allow": ["_node"] }]*/
          ctx.element._node.onclick = () => {
            scrollTo(
              document.getElementsByClassName('surveyComponent')[0],
              document.querySelector(`#section_${ctx.meta}`).offsetTop - 100,
              500,
            );
          };

          const scoreLabel = new Chartist.Svg('text');
          scoreLabel.text(ctx.value.y);
          scoreLabel.addClass('ct-label response__chart-label');
          scoreLabel.attr({
            x: (ctx.x2),
            y: (ctx.y2 - 5),
            'text-anchor': 'middle',
          });
          ctx.group.append(scoreLabel);
        }
      },
    }}
  />
);

const line = (chartType, data) => (
  <ChartistGraph
    data={{
      series: [
        {
          data: data.map(d => ({
            x: new Date(d.meta.DATE_CREATED),
            y: ((d.score.Overall * 100) / 4),
          })),
        },
      ],
    }}
    options={{
      showArea: true,
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 5,
        labelInterpolationFnc: value => moment(value).format('MMM YYYY'),
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
            y: ((ctx.y + (ctx.element.height() * -1)) - 10),
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

export default (dataType, chartType, data, classNames = 'ct-chart') => {
  switch (dataType) {
    case 'point':
      return (chartType === 'Pie') ?
        pie(chartType, data, classNames) :
        bar(chartType, data, classNames);
    case 'trend':
      return (chartType !== 'Bar') ?
        line(chartType, data, classNames) :
        bar(chartType, data, classNames);
    default:
      return '';
  }
};
