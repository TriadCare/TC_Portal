import moment from 'moment';

import { combineDatasource, getTitleBarText } from 'js/utilData';
import buildDashboardCards from 'js/utilDash';
import { IdentityActions } from 'components/Identity';

import dashboardConfiguration from './default_card_config.json'; // user pref doc

const compareHRAs = (hraOne, hraTwo) =>
  moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

const buildDashlets = state => buildDashboardCards(
  state,
  dashboardConfiguration,
  { HRA: compareHRAs },
);

function getUpdatedState(state, action) {
  const newState = combineDatasource(action.dataName, state, {
    isFetching: action.isFetching || false,
    isFresh: true,
    isPosting: action.isPosting || false,
    receivedAt: action.receivedAt,
    items: action.data || [],
  });
  return {
    ...newState,
    ...{
      initializingDashboard: action.isFetching,
      dashboardDashlets: buildDashlets(newState),
    },
  };
}

const initialState = {
  titleBarText: 'Executive Portal',
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
      uri: '/executive/profile',
      label: 'Profile',
      icon: 'user-circle',
    },
  ],
  datasources: {
    HRA: {
      label: 'HRA',
      uri: '/hras/?aggregate=true',
      items: [],
      isFetching: false,
      isFresh: false,
      receivedAt: undefined,
    },
  },
  dashboardDashlets: [],  // rehydrate in ReduxStore!
  initializingDashboard: true,
  profileConfiguration: undefined,
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case '@@router/LOCATION_CHANGE':
      return {
        ...state,
        ...{
          titleBarText: getTitleBarText(state, action.payload),
        },
      };
    case IdentityActions.POST_RESULT:
      return {
        ...state,
        ...{ selectedHRA: action.data.id },
      };
    case IdentityActions.RECEIVE_JWT:
      return {
        ...state,
        ...{
          titleBarText: getTitleBarText(state, action.response),
        },
      };
    case IdentityActions.POST_DATA:
    case IdentityActions.REQUEST_DATA:
    case IdentityActions.RECEIVE_DATA:
      return getUpdatedState(state, action);
    case IdentityActions.POST_FAILURE:
    case IdentityActions.REQUEST_ERROR:
    case IdentityActions.REQUEST_FAILURE:
    default:
      return state;
  }
};

export default appReducer;
