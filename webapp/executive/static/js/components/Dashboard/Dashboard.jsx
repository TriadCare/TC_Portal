import React from 'react';
import { connect } from 'react-redux';

import './css/Dashboard';

import AddDashletButton from './components/AddDashletButton';
import Dashlet from './components/Dashlet';

class Dashboard extends React.Component {
  addNewDashlet = () => {}

  render() {
    return (
      <div className="spaceComponent dashboardComponent">
        <h3>"ACME Dashboard"</h3>
        <AddDashletButton onClick={this.addNewDashlet} />
        {this.props.dashlets.map((dashlet) => (
          <Dashlet
            title={dashlet.title}
          />
        ))}
      </div>
    );
  }
}

Dashboard.propTypes = {
  dashlets: React.PropTypes.array.isRequired,
};

const mapStateToProps = (reduxStore) => ({
  dashlets: reduxStore.dashboardState.dashlets,
});

export default connect(mapStateToProps)(Dashboard);
