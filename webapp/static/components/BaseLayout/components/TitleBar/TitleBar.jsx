import React from 'react';
import { connect } from 'react-redux';

require('./css/TitleBar');

const TitleBar = (props) => (
  <div className="titleBar">
    <span className="tcLogo"></span>
    <span className="titleBarText">{props.titleBarText}</span>
    <span className="userStatus">Logged In</span>
  </div>
);

TitleBar.propTypes = {
  titleBarText: React.PropTypes.string.isRequired,
};

const mapStateToProps = (store) => ({
  titleBarText: store.appState.titleBarText,
});

export default connect(mapStateToProps)(TitleBar);
