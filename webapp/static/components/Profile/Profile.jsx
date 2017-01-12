import React from 'react';
import { connect } from 'react-redux';

require('./css/Profile');

const Profile = () => (
  <div className="spaceComponent profileComponent"></div>
);

const mapStateToProps = (store) => ({
  config: store.appState.profileConfiguration,
});

export default connect(mapStateToProps)(Profile);
