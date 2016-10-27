const React = require('react');

const ActionBar = (props) => (
  <div
    id="actionbar"
    className="actionbar"
    onClick={props.action}
  >
    "ActionBar"
  </div>
);

ActionBar.propTypes = {
  action: React.PropTypes.func.isRequired,
  actions: React.PropTypes.array.isRequired,
};

module.exports = ActionBar;
