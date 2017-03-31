import React from 'react';
import { Link } from 'react-router';
import { Tooltip, Position } from '@blueprintjs/core';

const MIN_WINDOW_WIDTH = 500;

class Navigation extends React.Component {
  constructor() {
    super();
    this.state = { windowWidth: 600 };
  }

  componentDidMount() {
    this.updateWindowWidth();
    window.addEventListener('resize', this.updateWindowWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowWidth);
  }

  updateWindowWidth = () => this.setState({ windowWidth: window.innerWidth })

  renderLink = link => (
    <Link
      key={link.id}
      to={link.uri}
      className={`pt-button pt-minimal pt-icon-${link.icon}`}
      activeClassName="pt-intent-primary"
    >
      { this.state.windowWidth < MIN_WINDOW_WIDTH ? '' : link.label}
    </Link>
  );

  render() {
    return (
      <div className="navigationContainer">
        {this.props.links.map(link => (
          this.state.windowWidth < MIN_WINDOW_WIDTH ?
          (<Tooltip
            key={link.id}
            position={Position.BOTTOM}
            content={link.label}
            hoverOpenDelay={500}
            transitionDuration={300}
          >
            {this.renderLink(link)}
          </Tooltip>) :
          this.renderLink(link)
        ))}
      </div>
    );
  }
}

Navigation.propTypes = {
  links: React.PropTypes.arrayOf(React.PropTypes.shape()),
};

Navigation.defaultProps = {
  links: [],
};

export default Navigation;
