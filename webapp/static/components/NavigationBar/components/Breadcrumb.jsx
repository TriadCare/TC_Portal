const React = require('react');

const Breadcrumb = (props) => (
  <div
    id="breadcrumb"
    className="breadcrumb"
    onClick={props.navigate('Navigation Occuring...')}
  >
    "Breadcrumb"
  </div>
);


Breadcrumb.propTypes = {
  navigate: React.PropTypes.func.isRequired,
  crumbs: React.PropTypes.array.isRequired,
};

module.exports = Breadcrumb;
