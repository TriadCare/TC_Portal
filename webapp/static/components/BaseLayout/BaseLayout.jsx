import React from 'react';

import { LoginComponent } from 'components/Identity';

import TitleBar from './components/TitleBar';
import SpaceExplorer from './components/SpaceExplorer';

const BaseLayout = (props) => (
  <div>
    <LoginComponent />
    <TitleBar />
    <SpaceExplorer />
    <div className="mainContainer">
      {props.children}
    </div>
  </div>
);

BaseLayout.propTypes = {
  children: React.PropTypes.object,
};

export default BaseLayout;
