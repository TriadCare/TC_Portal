import React from 'react';
import { connect } from 'react-redux';

require('./css/Reporting');

const Reporting = () => (
  <div className="spaceComponent reportingComponent"></div>
);

const mapStateToProps = (store) => ({
  data: store.reportingState.data,
});

export default connect(mapStateToProps)(Reporting);
