import { connect } from 'react-redux';
import { dashboardComponent as Dashboard } from 'components/Reporting';

import { refreshData, viewData } from '../ExecutiveActions';

const mapStateToProps = reduxStore => ({
  dashlets: reduxStore.appState.dashboardDashlets,
  isFetching: reduxStore.appState.initializingDashboard,
});

const mapDispatchToProps = dispatch => ({
  handleRefresh: dataName => dispatch(refreshData(dataName)),
  handleDashletClick: dashlet => dispatch(viewData(dashlet)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
