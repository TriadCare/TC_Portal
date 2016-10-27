import React from 'react';

require('./css/SpaceContainer');

const SpaceContainer = (props) => (
  <div className="SpaceContainer">
    {props.children}
  </div>
);

SpaceContainer.propTypes = {
  children: React.PropTypes.object,
};

export default SpaceContainer;
