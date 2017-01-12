// import * as actions from './ExecutiveActions';

import { IdentityActions } from 'components/Identity';

const initialState = {
  titleBarText: 'Executive Portal',
  onLogout: IdentityActions.invalidateJWT,
  spaces: [
    {
      uri: '/executive/dashboard',
      label: 'Dashboard',
      icon: 'heartbeat',
    },
    {
      uri: '/executive/reporting',
      label: 'Reporting',
      icon: 'bar-chart',
    },
    {
      uri: '/executive/cohort',
      label: 'Cohort',
      icon: 'users',
    },
    {
      uri: '/executive/profile',
      label: 'Profile',
      icon: 'user-circle',
    },
  ],
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case '@@router/LOCATION_CHANGE':
      return {
        ...state,
        ...{
          titleBarText: (state.spaces.find(
            (space) => (space.uri === action.payload.pathname)
          ) || { label: state.titleBarText }).label,
        },
      };
    default:
      return state;
  }
};

export default appReducer;
