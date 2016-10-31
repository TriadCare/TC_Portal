
import { createStore, combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import appReducer from './ExecutiveReducer';
import { dashboardReducer } from './components/Dashboard';
import { reportingReducer } from './components/Reporting';
import { cohortReducer } from './components/Cohort';
import { profileReducer } from './components/Profile';

// Use this to "rehydrate" the store or provide initial configuration
const initialState = {};
const store = createStore(combineReducers({
  appState: appReducer,
  dashboardState: dashboardReducer,
  reportingState: reportingReducer,
  cohortState: cohortReducer,
  profileState: profileReducer,
  routing: routerReducer,
}), initialState);

export default store;
