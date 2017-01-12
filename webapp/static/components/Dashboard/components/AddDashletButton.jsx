import React from 'react';

const AddDashletButton = (props) => (
  <div onClick={props.onClick}>
    <span className="fa fa-plus-circle"></span>
  </div>
);

AddDashletButton.propTypes = {
  onClick: React.PropTypes.func.isRequired,
};

export default AddDashletButton;
