import { IdentityActions } from 'components/Identity';

export const REFRESH_DATA = 'REFRESH_DATA';
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
      const request = new Request(appState.datasources[dataName].uri);
      dispatch(IdentityActions.fetchData(
        appState.datasources[dataName].label,
        request
      ));
    });
  };

// Open Data Detail depending on data type (HRA Viewer)
export const VIEW_DATA = 'VIEW_DATA';
export const viewData = (data) =>
  (dispatch, getState) => {
    const appState = getState().appState;
    console.log(`Viewing Data: ${data.datasource}`);
    data.data.forEach((item) =>
      console.log(`Viewing Record: ${item.meta[data.dataKey]}`)
    );
    console.log(`Number of Data Records: ${appState.datasources[data.datasource].items.length}`);
  };
