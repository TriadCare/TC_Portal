import React from 'react';
import { NonIdealState, Spinner /* , Button */ } from '@blueprintjs/core';

import './css/Dashboard.css';

// import AddDashletButton from './components/AddDashletButton';
import DashletContainer from './containers/DashletContainer';

const getLoadingComponent = () => (
  <NonIdealState
    visual="cloud-download"
    title="Fetching your Dashboard"
    description={'Hang tight while we set this up...'}
    action={<Spinner />}
  />
);

const getEmptyComponent = () => (
  <NonIdealState
    visual="folder-open"
    title="Nothing to show!"
    description={'Your dashboard is empty.'}
  />
);

const renderDashboard = (dashlets, isFetching, handleDashletClick) => {
  if (isFetching) {
    return getLoadingComponent();
  }
  // Need to build dashlets from provided configuration and datasources.
  if (dashlets.length !== 0) {
    return (
      dashlets.map(dashlet => (
        <DashletContainer
          key={dashlet.id}
          dashlet={dashlet}
          handleClick={() => handleDashletClick(dashlet)}
        />
      ))
    );
  }
  return getEmptyComponent();
};

const Dashboard = ({ dashlets, isFetching, /* handleRefresh, */handleDashletClick }) => (
  <div className="spaceComponent dashboardComponent">
    {/* <AddDashletButton onClick={this.addNewDashlet} /> */}
    {/* Omit dataName in handleRefresh call to refresh all datasources */}
    {/* <Button
      iconName="refresh"
      onClick={() => handleRefresh()}
    /> */}
    {renderDashboard(dashlets, isFetching, handleDashletClick)}
  </div>
);

Dashboard.propTypes = {
  dashlets: React.PropTypes.arrayOf(React.PropTypes.shape()).isRequired,
  isFetching: React.PropTypes.bool,
  // handleRefresh: React.PropTypes.func.isRequired,
  handleDashletClick: React.PropTypes.func.isRequired,
};

Dashboard.defaultProps = { isFetching: false };

export default Dashboard;
