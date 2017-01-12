import { connect } from 'react-redux';
import { dashboardComponent as Dashboard } from 'components/Dashboard';

import { refreshData, viewData } from '../PatientActions';

const mapStateToProps = (reduxStore) => ({
  dashlets: reduxStore.appState.dashboardDashlets,
  isFetching: reduxStore.appState.initializingDashboard,
});

const mapDispatchToProps = (dispatch) => ({
  handleRefresh: (dataName) => dispatch(refreshData(dataName)),
  handleDashletClick: (dashlet) => dispatch(viewData(dashlet)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
