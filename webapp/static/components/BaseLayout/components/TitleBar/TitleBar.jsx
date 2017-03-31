import React from 'react';
import { connect } from 'react-redux';
import { Tooltip, Position, Button } from '@blueprintjs/core';

import ConfirmationDialog from 'components/ConfirmationDialog';

require('./css/TitleBar');


class TitleBar extends React.Component {
  constructor() {
    super();
    this.state = { confirmationNeeded: false };
  }

  render() {
    return (
      <div className="pt-navbar pt-fixed-top titleBar">
        <div className="pt-navbar-group pt-align-left">
          <div className="titleBar__logo" />
          <div className="titleBar__label">
            <span className="titleBar__text">{this.props.titleBarText}</span>
          </div>
        </div>
        <div className="pt-navbar-group pt-align-right">
          {this.props.navigationComponent}
          <span className="pt-navbar-divider" />
          <Tooltip
            content="Log Out"
            position={Position.LEFT}
            hoverOpenDelay={1000}
            className="titleBar__log-out"
          >
            <Button
              className="pt-button pt-minimal pt-icon-power log-out__icon"
              onClick={() => this.setState({ confirmationNeeded: true })}
            />
          </Tooltip>
          <ConfirmationDialog
            autoFocus
            isOpen={this.state.confirmationNeeded}
            iconName={'warning-sign'}
            title={'You are about to Log Out'}
            body={'Are you sure you want to log out of your current session?'}
            onCancel={() => this.setState({ confirmationNeeded: false })}
            confirmButtonText="Log Out"
            onConfirm={() => this.setState({ confirmationNeeded: false }, this.props.onLogout)}
          />
        </div>
      </div>
    );
  }
}

TitleBar.propTypes = {
  titleBarText: React.PropTypes.oneOfType(
    [React.PropTypes.string, React.PropTypes.shape()],
  ),
  navigationComponent: React.PropTypes.element,
  onLogout: React.PropTypes.func.isRequired,
};

TitleBar.defaultProps = {
  titleBarText: '',
  navigationComponent: undefined,
};

const mapStateToProps = store => ({
  titleBarText: store.appState.titleBarText,
});

export default connect(mapStateToProps)(TitleBar);
