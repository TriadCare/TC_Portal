import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

require('./css/SpaceExplorer');

const SpaceExplorer = (props) => {
  let spaceLinks = [];
  props.spaces.forEach((space) => {
    spaceLinks.push(
      <Link
        to={space}
        className="spaceLink"
        activeClassName="spaceLinkActive"
        key={space}
      >
        {space}
      </Link>
    );
  });
  return (
    <div className="spaceExplorer">
      <span className="spaceExplorerExpanderButton"></span>
      <div className="spaceList">{spaceLinks}</div>
      <span className="spaceExplorerLogOutButton"></span>
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
