import React from 'react';

require('./css/SpaceContainer');

const SpaceContainer = props => (
  <div className="spaceContainer">
    {props.children}
  </div>
);

SpaceContainer.propTypes = {
  children: React.PropTypes.shape(),
};

SpaceContainer.defaultProps = { children: null };

export default SpaceContainer;
