import { push } from 'react-router-redux';
// import { oneLineTrim } from 'common-tags';
import { IdentityActions } from 'components/Identity';

// Action Creators
export const SELECT_REPORT_CONFIG = 'SELECT_REPORT_CONFIG';
export function selectReportConfig(config) {
  return {
    type: SELECT_REPORT_CONFIG,
    config,
  };
}

// Async Actions
export const refreshData = (dataSets, force = false) =>
  (dispatch, getState) => {
    const appState = getState().appState;
    // If dataSets not specified, refresh all datasources
    let datasources = [];
    if (dataSets === undefined) {
      datasources = Object.keys(appState.datasources);
    } else if (typeof dataSets === 'string') {
      datasources = [dataSets];
    } else {
      datasources = dataSets;
    }

    datasources.forEach((dataName) => {
      const request = new Request(appState.datasources[dataName].uri);
      dispatch(IdentityActions.fetchData(
        appState.datasources[dataName].label,
        request,
        force,
      ));
    });
  };

// Open Data Detail depending on data type and current context
export const viewData = data =>
  (/* dispatch, getState */) => {
    // const appState = getState().appState;
    switch (data.datasource) {
      case 'HRA':
        break;
      default:

    }
  };

// Open Reporting Component and feed it the provided configuration
export const showReport = config =>
  (dispatch) => {
    dispatch(selectReportConfig(config));
    dispatch(push('/executive/reporting'));
  };
