import React from 'react';
import { connect } from 'react-redux';

require('./css/Cohort');

const Cohort = () => (
  <div className="cohortComponent"></div>
);

const mapStateToProps = (store) => ({
  data: store.cohortState.data,
});

export default connect(mapStateToProps)(Cohort);
