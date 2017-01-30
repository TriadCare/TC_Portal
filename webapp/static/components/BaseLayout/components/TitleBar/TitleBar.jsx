import React from 'react';
import { connect } from 'react-redux';

import { Button } from '@blueprintjs/core';

require('./css/TitleBar');


const TitleBar = (props) => (
  <div className="pt-navbar pt-fixed-top titleBar">
    <div className="pt-navbar-group pt-align-left">
      <div className="titleBar__logo"></div>
      <div className="titleBar__label">
        <span className="titleBar__text">{props.titleBarText}</span>
      </div>
    </div>
    <div className="pt-navbar-group pt-align-right titleBar__log-out">
      <Button
        className="pt-button pt-minimal pt-icon-power log-out__icon"
        onClick={() => {
          props.dispatch(props.onLogout);
          location.pathname = '/';
        }}
      />
    </div>
  </div>
);

TitleBar.propTypes = {
  titleBarText: React.PropTypes.object.isRequired,
  onLogout: React.PropTypes.func.isRequired,
  dispatch: React.PropTypes.func.isRequired,
};

const mapStateToProps = (store) => ({
  titleBarText: store.appState.titleBarText,
  onLogout: store.appState.onLogout,
  dispatch: store.dispatch,
});

export default connect(mapStateToProps)(TitleBar);
