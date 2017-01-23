import { push } from 'react-router-redux';
import { oneLineTrim } from 'common-tags';
import { IdentityActions } from 'components/Identity';

export const SELECT_HRA = 'SELECT_HRA';
export function selectHRA(responseID) {
  return {
    type: SELECT_HRA,
    responseID,
  };
}

export const NEW_HRA = 'NEW_HRA';
export function newHRA() {
  return {
    type: NEW_HRA,
    responseID: undefined,
  };
}

export const SUBMIT_HRA = 'SUBMIT_HRA';
export function submitHRA() {
  return {
    type: SUBMIT_HRA,
  };
}

// Async Actions
export const refreshData = (dataSets) =>
  (dispatch, getState) => {
    const appState = getState().appState;
    // If dataSets not specified, refresh all datasources
    let datasources = [];
    if (dataSets === undefined) {
      datasources = Object.keys(appState.datasources);
    } else if (typeof(dataSets) === 'string') {
      datasources = [dataSets];
    } else {
      datasources = dataSets;
    }

    datasources.forEach((dataName) => {
      if (dataName === 'EXPANDED_HRA') {
        if (appState.selectedHRA !== undefined) {
          const request = new Request(oneLineTrim`
            ${appState.datasources.HRA.uri}
            ${appState.selectedHRA}
            ${appState.datasources.HRA.expandParameter}
          `);
          dispatch(IdentityActions.fetchData(dataName, request));
        }
      } else {
        const request = new Request(appState.datasources[dataName].uri);
        dispatch(IdentityActions.fetchData(
          appState.datasources[dataName].label,
          request
        ));
      }
    });
  };

export const submitHRAResponse = (response, complete) =>
  (dispatch, getState) => {
    const state = getState().appState;
    const hraState = state.datasources.EXPANDED_HRA;
    const method = (state.selectedHRA !== undefined) ? 'PUT' : 'POST';
    dispatch(submitHRA());
    dispatch(IdentityActions.submitData(
      'EXPANDED_HRA',
      new Request(oneLineTrim
        `${hraState.uri}
        ${method === 'PUT' ? `${state.selectedHRA}` : ''}
        ?complete=${complete ? 1 : 0}`,
        { method, body: JSON.stringify(response) }
      ), refreshData
    ));
  };


// Open Data Detail depending on data type (HRA Viewer)
export const viewData = (data) =>
  (dispatch, getState) => {
    const appState = getState().appState;
    switch (data.datasource) {
      case 'HRA':
        // If no data, this is a new HRA
        if (data.data !== undefined) {
          dispatch(selectHRA(data.data[0].meta[data.dataKey]));
          dispatch(IdentityActions.fetchData(
            'EXPANDED_HRA',
            new Request(oneLineTrim`
              ${appState.datasources.HRA.uri}
              ${data.data[0].meta[data.dataKey]}
              ${appState.datasources.HRA.expandParameter}
            `)
          ));
        } else {
          dispatch(newHRA());
        }
        dispatch(push('/patient/hra'));
        break;
      default:
        return;
    }
  };
