import React from 'react';

const Dashlet = (props) => (
  <h3>{props.title}</h3>
);

Dashlet.propTypes = {
  title: React.PropTypes.string.isRequired,
};

export default Dashlet;
