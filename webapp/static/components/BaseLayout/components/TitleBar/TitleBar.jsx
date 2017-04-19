import React from 'react';
import { connect } from 'react-redux';
import {
  Button, Position, Popover,
  Menu, MenuItem, MenuDivider,
} from '@blueprintjs/core';

import { jwtPayload } from 'js/utilREST';
import ConfirmationDialog from 'components/ConfirmationDialog';

require('./css/TitleBar');


class TitleBar extends React.Component {
  constructor() {
    super();
    this.state = { confirmationNeeded: false };
  }

  renderUserMenu = () => {
    const jwtUser = jwtPayload();
    return (
      <Menu>
        { jwtUser !== undefined &&
          jwtPayload().roles.filter(role =>
            this.props.currentPathname.split('/')[1] !== role.toLowerCase(),
          ).map(role => (
            <MenuItem
              key={role}
              iconName="log-out"
              text={
                `${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()} Portal`
              }
              onClick={() => {
                location.pathname = `/${role.toLowerCase()}/`;
              }}
            />
          ))
        }
        {jwtUser !== undefined && jwtUser.roles.length > 1 && <MenuDivider />}
        <MenuItem
          iconName="power"
          text="Log Out"
          onClick={() => this.setState({ confirmationNeeded: true })}
        />
      </Menu>
    );
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
        <div className="pt-navbar-group pt-align-right titleBar__nav">
          {this.props.navigationComponent}
          <span className="pt-navbar-divider" />
          <Popover
            position={Position.BOTTOM_RIGHT}
            content={this.renderUserMenu()}
          >
            <Button
              className="pt-button pt-minimal pt-icon-user userMenuButton"
            />
          </Popover>
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
  currentPathname: React.PropTypes.string.isRequired,
};

TitleBar.defaultProps = {
  titleBarText: '',
  navigationComponent: null,
  currentPathname: {},
};

const mapStateToProps = store => ({
  titleBarText: store.appState.titleBarText,
});

export default connect(mapStateToProps)(TitleBar);
