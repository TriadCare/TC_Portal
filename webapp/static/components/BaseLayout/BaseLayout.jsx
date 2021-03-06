import React from 'react';

import { LoginComponent } from 'components/Identity';

import TitleBar from './components/TitleBar';
import SpaceExplorer from './components/SpaceExplorer';

const BaseLayout = props => (
  <div className="baseLayout">
    <LoginComponent onLogin={props.onLogin} />
    <TitleBar
      onLogout={props.onLogout}
      navigationComponent={props.navigationComponent}
      currentPathname={props.location.pathname}
    />
    <div className="mainContainer">
      <SpaceExplorer />
      <div className="appletContainer">
        {props.children}
      </div>
    </div>
  </div>
);

BaseLayout.propTypes = {
  navigationComponent: React.PropTypes.shape(),
  onLogin: React.PropTypes.func,
  onLogout: React.PropTypes.func,
  children: React.PropTypes.shape(),
  location: React.PropTypes.shape({
    pathname: React.PropTypes.string,
  }).isRequired,
};

BaseLayout.defaultProps = {
  navigationComponent: null,
  onLogin: () => {},
  onLogout: () => {},
  children: {},
};

export default BaseLayout;
