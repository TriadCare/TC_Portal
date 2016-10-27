import React from 'react';
import { connect } from 'react-redux';

require('./css/Profile');

const Profile = () => (
  <div className="profileComponent"></div>
);

const mapStateToProps = (store) => ({
  data: store.profileState.data,
});

export default connect(mapStateToProps)(Profile);
