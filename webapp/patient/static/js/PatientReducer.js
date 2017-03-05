import { combineDatasource, getTitleBarText } from 'js/utilData';

import { IdentityActions } from 'components/Identity';
import { SELECT_HRA, NEW_HRA, SUBMIT_HRA } from './PatientActions';

import surveyConfigV2 from 'hra_files/v3/english/hra_definition.json';
import surveyConfigV2Spanish from 'hra_files/v3/spanish/hra_definition.json';
import surveyConfigV4 from 'hra_files/v4/english/hra_definition.json';

const latestSurveyVersion = 'v4';
const surveyConfigurations = {
  v2: surveyConfigV2,
  v3: surveyConfigV2Spanish,
  v4: surveyConfigV4,
};

function getUpdatedState(state, action) {
  const newState = combineDatasource(action.dataName, state, {
    isFetching: action.isFetching || false,
    isFresh: true,
    isPosting: action.isPosting || false,
    receivedAt: action.receivedAt,
    items: action.data || [],
  });

  let currentSurveyID = latestSurveyVersion;
  if (newState.datasources.EXPANDED_HRA.items !== undefined &&
      newState.datasources.EXPANDED_HRA.items.length !== 0 &&
      newState.datasources.EXPANDED_HRA.items[0].meta.surveyID !== undefined) {
    currentSurveyID = `v${newState.datasources.EXPANDED_HRA.items[0].meta.surveyID}`;
  }
  const surveyConfiguration = surveyConfigurations[currentSurveyID];

  return {
    ...newState,
    ...{
      initializingDashboard: action.isFetching,
      surveyConfiguration,
    },
  };
}

const blankHRA = {
  label: 'EXPANDED_HRA',
  uri: '/hras/',
  items: [{ meta: { completed: false }, questionnaire: [] }],
  isFetching: false,
  isFresh: true,
};

const initialState = {
  titleBarText: 'Patient Portal',
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
  surveyConfiguration: surveyConfigurations[latestSurveyVersion],
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
        ...{
          surveyConfiguration: surveyConfigurations[latestSurveyVersion],
          selectedHRA: action.responseID,
        },
      };
    case SUBMIT_HRA:
      return combineDatasource(
        'EXPANDED_HRA',
        combineDatasource(
          'HRA',
          state,
          { isFresh: false },
        ),
        { isFresh: false },
      );
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
