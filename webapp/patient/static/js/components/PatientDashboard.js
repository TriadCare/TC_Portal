import moment from 'moment';
import { connect } from 'react-redux';

import { jwtPayload } from 'js/utilREST';
import Dashboard from 'components/Dashboard';

import { refreshData, viewData } from '../PatientActions';
import dashboardConfiguration from '../default_card_config.json'; // user pref doc

const compareHRAs = (hraOne, hraTwo) =>
  -moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

const populateCard = (card, dataItems, sortFunc) => {
  const { cardDefinition, ...rest } = card;
  const data = ((card.data.length === 0) ?
    dataItems :
    card.data.map(
      key => dataItems.find(item => item.meta[card.dataKey] === key),
    ).sort(sortFunc));
  return { ...cardDefinition, ...rest, ...{ data } };
};

const buildDashboardCards = (state) => {
  const dashlets = [];
  const sortOptions = { HRA: compareHRAs };

  dashboardConfiguration.forEach((card) => {
    if (state.datasources[card.datasource].items.length === 0) {
      return;  // no data for this card, leave it out.
    }
    switch (card.cardType) {
      case 'unfold':
        if (card.data.length === 0) {  // Use every datapoint
          dashlets.push(
            ...state.datasources[card.datasource].items
              .sort(sortOptions[card.datasource])
              .map(
                (item, index) => populateCard(
                  {
                    ...card,
                    ...{ id: `${card.id}_${index}` },
                    ...{ data: [item.meta[card.dataKey]] },
                  },
                  state.datasources[card.datasource].items,
                  sortOptions[card.datasource],
                ),
              ),
          );
          return;
        }
        // if data IDs are specified, only use those.
        dashlets.push(...card.data.map((data, index) =>
          populateCard(
            {
              ...card,
              ...{ id: `card.id_${index}` },
              ...{ data: [data] },
            },
            state.datasources[card.datasource].items
              .sort(sortOptions[card.datasource]),
            sortOptions[card.datasource],
          ),
        ));
        return;
      case 'map':
      default:
        dashlets.push(populateCard(
          card,
          (state.datasources[card.datasource].items
            .filter(item => item.meta.completed === 1)
            .sort(sortOptions[card.datasource])),
          sortOptions[card.datasource],
        ));
    }
  });

  // Also add a New HRA card if needed (eligibleForHRA && haven't taken one today)
  const user = jwtPayload();
  if (user !== undefined) {
    if (user.hraEligible === '1') {
      if (state.datasources.HRA.items.reduce(
        (shouldContinue, hra) => (
          shouldContinue && moment().diff(hra.meta.DATE_CREATED, 'days') > 1
        )
      , true)) {
        dashlets.splice(1, 0, {
          id: 0,
          cardSize: 'medium',
          datasource: 'HRA',
          title: 'New HRA',
          description: 'Click here to start a new HRA.',
          dataType: undefined,
          chartType: undefined,
        });
      }
    }
  }

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
