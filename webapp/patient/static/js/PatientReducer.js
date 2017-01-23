import moment from 'moment';

import { jwtPayload } from 'js/util';
import { IdentityActions } from 'components/Identity';
import { SELECT_HRA, NEW_HRA, SUBMIT_HRA } from './PatientActions';

import dashboardConfiguration from './default_dashlet_config'; // user pref doc
import hraSurveyConfiguration from './hra_new.json';

const compareHRAs = (hraOne, hraTwo) =>
  moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

const populateCard = (card, dataItems) => {
  const { cardDefinition, ...rest } = card;
  const data = ((card.data.length === 0) ?
    dataItems :
    card.data.map((key) => dataItems.find((item) => item.meta[card.dataKey] === key
    )).sort(compareHRAs));
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
            (item) => populateCard(
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
          (state.datasources[card.datasource].items
            .filter((item) => item.meta.completed === 1)
            .sort(compareHRAs))
        ));
    }
  });
  // Also add a New HRA card if needed
  if (dashlets.length !== 0) {
    const user = jwtPayload();
    if (user !== undefined) {
      // if (user.eligibleForHRA) {}
      dashlets.push({
        cardSize: 'medium',
        datasource: 'HRA',
        title: 'New HRA',
        description: 'Click here to start a new HRA.',
        dataType: undefined,
        chartType: undefined,
      });
    }
  }
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

const getTitleBarText = (state, payload) => {
  let location;
  let name;
  if (payload.pathname !== undefined) {
    const path = payload.pathname.split('/');
    location = path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1);
    const user = jwtPayload();
    if (user === undefined) {
      return `Patient ${location}`;
    }
    name = user.first_name;
  } else if (payload.jwt !== undefined) {
    name = jwtPayload(payload.jwt).first_name;
    location = 'Dashboard';
  }
  return `Hi ${name}, this is your ${location}.`;
};

const blankHRA = {
  label: 'EXPANDED_HRA',
  uri: '/hras/',
  items: [{ meta: { completed: false }, questionnaire: [] }],
  isFetching: false,
  isFresh: true,
};

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
    EXPANDED_HRA: {
      label: 'EXPANDED_HRA',
      uri: '/hras/',
      isFetching: false,
      isPosting: false,
    },
    TC_HRA: {
      label: 'TC_HRA',
      uri: '/hras/-1',
      items: [],
      isFetching: false,
      isFresh: false,
      receivedAt: undefined,
    },
  },
  dashboardDashlets: [],  // rehydrate in PatientReduxStore!
  initializingDashboard: true,
  surveyConfiguration: hraSurveyConfiguration,
  selectedHRA: undefined,
  profileConfiguration: undefined,
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case SELECT_HRA:
      return {
        ...combineDatasource('EXPANDED_HRA', state, {
          ...state.EXPANDED_HRA,
          ...{
            isFresh: state.selectedHRA === action.responseID,
          },
        }),
        ...{ selectedHRA: action.responseID },
      };
    case NEW_HRA:
      return {
        ...combineDatasource('EXPANDED_HRA', state, blankHRA),
        ...{ selectedHRA: action.responseID },
      };
    case SUBMIT_HRA:
      return {
        ...combineDatasource('EXPANDED_HRA', state, { isFresh: false }),
      };
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
    case IdentityActions.REQUEST_DATA:
    case IdentityActions.RECEIVE_DATA:
      return getUpdatedState(state, action);
    case IdentityActions.REQUEST_ERROR:
    case IdentityActions.REQUEST_FAILURE:
    default:
      return state;
  }
};

export default appReducer;
