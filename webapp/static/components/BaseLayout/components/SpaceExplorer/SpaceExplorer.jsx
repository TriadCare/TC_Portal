import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

require('./css/SpaceExplorer');

const SpaceExplorer = (props) => {
  let spaceLinks = [];
  let profileLink = undefined;
  // If no spaces, don't render
  if (props.spaces.length === 0) {
    return null;
  }
  // Compile the spaces into the space explorer
  props.spaces.forEach((space) => {
    spaceLinks.push(
      <div key={space.label} className="spaceExplorer__item">
        <span
          className={"sr-only"}
          id={`${space.label}-label`}
        >{space.label}</span>
        <Link
          to={space.uri}
          className={`spaceLink spaceIcon fa fa-${space.icon}`}
          activeClassName="spaceLinkActive"
          aria-labelledby={`${space.label}-label`}
        />
      </div>
    );
    if (space.label === 'Profile') {  // Profile goes at the end
      profileLink = spaceLinks.pop();
    }
  });

  return (
    <div className="spaceExplorer">
      <div className="spaceExplorer__item spaceExplorer__toggle">
        <span className="spaceIcon fa fa-bars"></span>
      </div>
      <div className="spaceExplorer__list">{spaceLinks}</div>
      {profileLink}
    </div>
  );
};

SpaceExplorer.propTypes = {
  spaces: React.PropTypes.array.isRequired,
};

const mapStateToProps = function mapStateToProps(store) {
  return {
    spaces: store.appState.spaces,
  };
};

export default connect(mapStateToProps)(SpaceExplorer);
