import moment from 'moment';
import { connect } from 'react-redux';
import { dashboardComponent as Dashboard } from 'components/Dashboard';

import { refreshData, viewData } from '../ExecutiveActions';
import dashboardConfiguration from '../default_card_config.json'; // user pref doc

const compareHRAs = (hraOne, hraTwo) =>
  moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

// This function sums the values in the objects with the same key,
// then divides the sums by the length of the of the list.
const averageValues = (dataList) => {
  const sumObj = dataList.reduce((acc, item) => {
    if (acc === undefined) {
      return item;
    }
    const newAcc = {};
    Object.keys(acc).forEach((key) => {
      newAcc[key] = acc[key] + item[key];
    });
    return newAcc;
  });

  const avgObj = {};
  Object.keys(sumObj).forEach((key) => {
    avgObj[key] = Math.round((sumObj[key] / dataList.length) * 100) / 100;
  });
  return avgObj;
};

const buildDashboardCards = (state) => {
  const dashlets = [];
  const sortOptions = { HRA: compareHRAs };

  dashboardConfiguration.forEach((card) => {
    const { cardDefinition, ...rest } = card;
    const dataItems = state.datasources[card.datasource].items;

    if (dataItems.length === 0) {
      return;  // no data for this card, leave it out.
    }

    switch (card.cardType) {
      case 'fold':
      default:
        dashlets.push({
          ...cardDefinition,
          ...rest,
          ...{
            // should filter the data into event time periods here
            data: [{
              score: averageValues(
                dataItems
                .sort(sortOptions[card.datasource])
                .map(item => item.score),
              ),
            }],
          },
        });
    }
  });
  return dashlets;
};

const mapStateToProps = reduxStore => ({
  dashlets: buildDashboardCards(reduxStore.appState),
  isFetching: reduxStore.appState.initializingDashboard,
});

const mapDispatchToProps = dispatch => ({
  handleRefresh: dataName => dispatch(refreshData(dataName)),
  handleDashletClick: dashlet => dispatch(viewData(dashlet)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
