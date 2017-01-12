import moment from 'moment';
import { IdentityActions } from 'components/Identity';

import dashboardConfiguration from './default_dashlet_config'; // user pref doc

const compareHRAs = (hraOne, hraTwo) =>
  moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

const populateCard = (card, dataItems) => {
  const { cardDefinition, ...rest } = card;
  const data = ((card.data.length === 0) ?
    dataItems :
    card.data.map((key) => dataItems.find((item) => item.meta[card.dataKey] === key)))
    .sort(compareHRAs);
  return { ...cardDefinition, ...rest, ...{ data } };
};

export const buildDashlets = (state) => {
  const dashlets = [];

  dashboardConfiguration.forEach((card) => {
    if (state.datasources[card.datasource].items.length === 0) {
      return;  // no data for this card, leave it out.
    }
    switch (card.cardType) {
      case 'group':
        if (card.data.length === 0) {  // Use every datapoint
          dashlets.push(...state.datasources[card.datasource].items.sort(compareHRAs).map(
            (item) =>
              populateCard(
                { ...card, ...{ data: [item.meta[card.dataKey]] } },
                state.datasources[card.datasource].items
              )
          ));
          return;
        }
        // if data IDs are specified, only use those.
        dashlets.push(...card.data.map((data) =>
          populateCard(
            { ...card, ...{ data: [data] } },
            state.datasources[card.datasource].items.sort(compareHRAs)
          )
        ));
        return;
      case 'single':
      default:
        dashlets.push(populateCard(
          card,
          state.datasources[card.datasource].items.sort(compareHRAs)
        ));
    }
  });

  return dashlets;
};

function combineDatasource(datasourceName, oldState, newData) {
  return {
    ...oldState,
    ...{
      datasources: {
        ...oldState.datasources,
        ...{
          [datasourceName]: {
            ...oldState.datasources[datasourceName],
            ...newData,
          },
        },
      },
    },
  };
}

function getUpdatedState(state, action) {
  const newState = combineDatasource(action.dataName, state, {
    isFetching: action.isFetching,
    isFresh: true,
    receivedAt: action.receivedAt,
    items: action.data || [],
  });
  return {
    ...newState,
    ...{
      initializingDashboard: action.isFetching,
    },
    ...{
      dashboardDashlets: buildDashlets(newState),
    },
  };
}

const initialState = {
  titleBarText: 'Patient Portal',
  onLogout: IdentityActions.invalidateJWT,
  spaces: [],
  datasources: {
    HRA: {
      label: 'HRA',
      uri: '/hras/',
      expandParameter: '?expand=true',
      items: [],
      isFetching: false,
      isFresh: false,
      receivedAt: undefined,
    },
  },
  dashboardDashlets: [],  // rehydrate in PatientReduxStore!
  initializingDashboard: true,
  profileConfiguration: undefined,
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case '@@router/LOCATION_CHANGE':
      return {
        ...state,
        ...{
          titleBarText: action.payload.pathname.split('/').map(
            (s) => s.charAt(0).toUpperCase() + s.slice(1)
          ).join(' '),
        },
      };
    case IdentityActions.REQUEST_DATA:
    case IdentityActions.REQUEST_ERROR:
    case IdentityActions.REQUEST_FAILURE:
    case IdentityActions.RECEIVE_DATA:
      return getUpdatedState(state, action);
    default:
      return state;
  }
};

export default appReducer;
