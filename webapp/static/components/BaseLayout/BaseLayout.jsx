import React from 'react';

import { LoginComponent } from 'components/Identity';

import TitleBar from './components/TitleBar';
import SpaceExplorer from './components/SpaceExplorer';

const BaseLayout = props => (
  <div className="baseLayout">
    <LoginComponent onLogin={props.onLogin} />
    <TitleBar onLogout={props.onLogout} />
    <div className="mainContainer">
      <SpaceExplorer />
      <div className="appletContainer">
        {props.children}
      </div>
    </div>
  </div>
);

BaseLayout.propTypes = {
  onLogin: React.PropTypes.func,
  onLogout: React.PropTypes.func,
  children: React.PropTypes.shape(),
};

BaseLayout.defaultProps = {
  onLogin: () => {},
  onLogout: () => {},
  children: {},
};

export default BaseLayout;
