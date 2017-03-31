import { connect } from 'react-redux';
import { dashboardComponent as Dashboard } from 'components/Dashboard';

import { buildReport } from '../ExecutiveDataTransform';
import { showReport } from '../ExecutiveActions';
import dashboardConfiguration from '../default_card_config.json'; // user pref doc
import reportControls from '../report_controls.json';


const buildDashChartConfig = (dashcardConfig) => {
  // also need to add chart config here
  const baseControls = {};
  Object.entries(reportControls.Base).forEach(([key, control]) => {
    baseControls[key] = {
      ...control,
      ...dashcardConfig.selectedControls[key],
    };
  });

  const chartControls = {};
  Object.entries(reportControls.Chart).forEach(([key, control]) => {
    chartControls[key] = {
      ...control,
      ...dashcardConfig.selectedControls[key],
    };
  });

  // Add controls specfic to the dataset
  const dataControls = reportControls.Data.HRA;

  const combinedControls = {
    Base: baseControls,
    Chart: chartControls,
    Data: dataControls,
  };
  return { controls: combinedControls };
};

const buildDashboardCards = (state) => {
  const dashlets = [];
  dashboardConfiguration.forEach((card) => {
    const { cardDefinition, ...rest } = card;
    const dataItems = state.datasources[card.datasource].items;
    // no data for this card, leave it out.
    if (dataItems.length === 0) { return; }

    switch (card.cardType) {
      case 'fold':
      default:
        dashlets.push({
          ...cardDefinition,
          ...rest,
          ...buildReport(
            state.datasources,
            buildDashChartConfig(card),
          ),
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
  handleDashletClick: config => dispatch(showReport(config)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
