// Use this to "rehydrate" the store or provide initial configuration
// import chartConfiguration from './ChartConfiguration.json';
// import reports from '../../test/reports.json';
// import reportingClaimsMock from '../../test/Mock_Claims_Datasource.json';

// const datasources = {
//   [reportingClaimsMock.id]: reportingClaimsMock,
// };
//
// const initialState = {
//   chartConfiguration,
//   reports,
//   datasources,
// };

const initialState = {
  isFetching: false,
  reports: [],
  datasources: {},
  chartConfiguration: {},
};

const reportingReducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

export default reportingReducer;
