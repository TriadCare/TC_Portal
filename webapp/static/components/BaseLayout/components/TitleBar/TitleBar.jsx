import React from 'react';
import { connect } from 'react-redux';

require('./css/TitleBar');

const TitleBar = (props) => (
  <div className="titleBar">
    <div className="titleBar__logo"></div>
    <div className="titleBar__label">
      <span className="titleBar__text">{props.titleBarText}</span>
    </div>
    <div className="titleBar__log-out">
      <span className="log-out__icon fa fa-power-off"></span>
    </div>
  </div>
);

TitleBar.propTypes = {
  titleBarText: React.PropTypes.string.isRequired,
};

const mapStateToProps = (store) => ({
  titleBarText: store.appState.titleBarText,
});

export default connect(mapStateToProps)(TitleBar);
