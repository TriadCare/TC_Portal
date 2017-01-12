import React from 'react';
// import { connect } from 'react-redux';

import Dashlet from '../components/Dashlet';

const DashletContainer = (props) => (
  <div className={`dashletContainer dashletContainer__${props.dashlet.cardSize}`}>
    <Dashlet config={props.dashlet} handleClick={props.handleClick} />
  </div>
);

DashletContainer.propTypes = {
  dashlet: React.PropTypes.object.isRequired,
  handleClick: React.PropTypes.func,
};

export default DashletContainer;
