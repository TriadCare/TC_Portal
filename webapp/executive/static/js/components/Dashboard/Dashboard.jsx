import React from 'react';
import { connect } from 'react-redux';

import './css/Dashboard';

import DashletContainer from './components/DashletContainer';

const Dashboard = (props) => (
  <div className="spaceComponent dashboardComponent">
    {props.dashlets.map((dashlet) => (
      <DashletContainer
        title={dashlet.title}
      />
    ))}
  </div>
);

Dashboard.propTypes = {
  dashlets: React.PropTypes.array,
};

const mapStateToProps = (reduxStore) => ({
  dashlets: reduxStore.dashboardState.data,
});

export default connect(mapStateToProps)(Dashboard);
