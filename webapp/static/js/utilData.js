import React from 'react';
import { Link } from 'react-router';

export const combineDatasource = (datasourceName, oldState, newData) => (
  {
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
  }
);

/* eslint-disable react/jsx-filename-extension */
export const getTitleBarText = (state, payload) => {
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
              to={'/patient/dashboard'}
              className="pt-breadcrumb breadcrumb__item"
            >Dashboard</Link></li>
            <li><Link
              to={'/patient/hra'}
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
          to={'/patient/dashboard'}
          className="pt-breadcrumb breadcrumb__item"
        >Patient Portal</Link></li>
      </ul>
    </div>
  );
};
/* eslint-enable */
