import { connect } from 'react-redux';
import { dashboardComponent as Dashboard } from 'components/Dashboard';

import { buildReport } from '../ExecutiveDataTransform';
import { showReport } from '../ExecutiveActions';
import dashboardConfiguration from '../default_card_config.json'; // user pref doc
import reportControls from '../report_controls.json'; // user pref doc


const buildDashChartConfig = (dashcardConfig) => {
  const baseControls = reportControls.Base;
  const config = {};
  Object.entries(baseControls).forEach(([k, v]) => {
    config[k] = {
      ...v,
      ...dashcardConfig.selectedControls[k],
    };
  });
  return { controls: config };
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
