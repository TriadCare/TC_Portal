import React from 'react';
import { NonIdealState, Spinner } from '@blueprintjs/core';

import './css/Reporting.css';
import ReportContainer from './components/ReportContainer';

const getLoadingComponent = () => (
  <NonIdealState
    visual="cloud-download"
    title="Fetching Report Data"
    description={'Hang tight while we set this up...'}
    action={<Spinner />}
  />
);

const Reporting = props => (
  <div className="spaceComponent reportingComponent">
    {props.isFetching ?
      getLoadingComponent() :
      <ReportContainer {...props} />
    }
  </div>
);

Reporting.propTypes = {
  isFetching: React.PropTypes.bool,
};

Reporting.defaultProps = {
  isFetching: true,
};

export default Reporting;
