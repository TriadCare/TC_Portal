import moment from 'moment';
import React from 'react';
import { Link } from 'react-router';

import { jwtPayload } from 'js/util';
import { IdentityActions } from 'components/Identity';
import { SELECT_HRA, NEW_HRA, SUBMIT_HRA } from './PatientActions';

import dashboardConfiguration from './default_dashlet_config'; // user pref doc

import surveyConfigV2 from 'hra_files/v3/english/hra_definition.json';
import surveyConfigV2Spanish from 'hra_files/v3/spanish/hra_definition.json';
import surveyConfigV4 from 'hra_files/v4/english/hra_definition.json';
const latestSurveyVersion = 'v4';
const surveyConfigurations = {
  v2: surveyConfigV2,
  v3: surveyConfigV2Spanish,
  v4: surveyConfigV4,
};

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
          dashlets.push(...state.datasources[card.datasource].items.sort(compareHRAs).reverse().map(
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
            state.datasources[card.datasource].items.sort(compareHRAs).reverse
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
      dashlets.splice(1, 0, {
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
      dashboardDashlets: buildDashlets(newState),
      surveyConfiguration: surveyConfigurations[
        (newState.datasources.EXPANDED_HRA.items !== undefined &&
            newState.datasources.EXPANDED_HRA.items.length !== 0) ?
          `v${newState.datasources.EXPANDED_HRA.items[0].meta.surveyID}` :
          latestSurveyVersion
      ],
    },
  };
}

const getTitleBarText = (state, payload) => {
  if (payload.pathname !== undefined) {
    const path = payload.pathname;
    if (path === '/patient/dashboard') {
      return (
        <div className="breadcrumb__container">
          <ul className="pt-breadcrumbs">
            <li><div className="pt-breadcrumb">Dashboard</div></li>
          </ul>
        </div>
      );
    }
    if (path === '/patient/hra') {
      return (
        <div className="breadcrumb__container">
          <ul className="pt-breadcrumbs">
            <li><Link
              to={"/patient/dashboard"}
              className="pt-breadcrumb breadcrumb__item"
            >Dashboard</Link></li>
            <li><Link
              to={"/patient/hra"}
              className="pt-breadcrumb breadcrumb__item"
            >HRA</Link></li>
          </ul>
        </div>
      );
    }
  }
  return (
    <div className="breadcrumb__container">
      <ul className="pt-breadcrumbs">
        <li><Link
          to={"/patient/dashboard"}
          className="pt-breadcrumb breadcrumb__item"
        >Dashboard</Link></li>
      </ul>
    </div>
  );
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
          { isFresh: false }
        ),
        { isFresh: false }
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
