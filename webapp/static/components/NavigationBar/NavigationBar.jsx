const React = require('react');
// components
const Breadcrumb = require('./components/Breadcrumb');
const ActionBar = require('./components/ActionBar');
// style
require('./css/NavigationBar.css');

class NavigationBar extends React.Component {
  constructor() {
    super();
    this.state = ({});

    this.navigate = this.navigate.bind(this);
  }

  navigate(crumb) {
    alert(`navigating to ${crumb}`);
  }

  action() {
    alert('action!');
  }

  render() {
    return (
      <div id="navBar" className="navBar">
        <h1>Welcome to my Navigation Bar Sample!</h1>
        <div className="well ">
          <Breadcrumb
            navigate={this.navigate}
            crumbs={['one', 'two', 'three']}
          />
          <ActionBar
            action={this.action}
            actions={['settings']}
          />
        </div>
      </div>
    );
  }
}

module.exports = NavigationBar;
