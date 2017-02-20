// import { push } from 'react-router-redux';
// import { oneLineTrim } from 'common-tags';
import { IdentityActions } from 'components/Identity';

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
