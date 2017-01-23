import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { surveyComponent as Survey } from 'components/Survey';

import {
  submitHRAResponse,
  refreshData,
} from '../PatientActions';

const mapStateToProps = (reduxStore) => ({
  config: reduxStore.appState.surveyConfiguration,
  response: reduxStore.appState.datasources.EXPANDED_HRA,
  TCAvgHRA: reduxStore.appState.datasources.TC_HRA,
});

const mapDispatchToProps = (dispatch) => ({
  handleSave: (response) => dispatch(submitHRAResponse(response, false)),
  handleSubmit: (response) => dispatch(submitHRAResponse(response, true)),
  handleRefresh: () => dispatch(refreshData()),
  goBackToDashboard: () => dispatch(push('/patient/dashboard')),
});

export default connect(mapStateToProps, mapDispatchToProps)(Survey);
