import React from 'react';
import { connect } from 'react-redux';

require('./css/Dashboard');

const Dashboard = () => (
  <div className="dashboardComponent"></div>
);

const mapStateToProps = (store) => ({
  data: store.dashboardState.data,
});

export default connect(mapStateToProps)(Dashboard);
