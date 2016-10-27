import React from 'react';

import TitleBar from './components/TitleBar';
import SpaceExplorer from './components/SpaceExplorer';

const BaseLayout = (props) => (
  <div>
    <TitleBar />
    <SpaceExplorer />
    <div className="mainChildrenContainer">
      {props.children}
    </div>
  </div>
);

BaseLayout.propTypes = {
  children: React.PropTypes.object,
};

export default BaseLayout;
