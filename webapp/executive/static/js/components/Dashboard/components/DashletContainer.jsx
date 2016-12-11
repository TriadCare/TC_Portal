import React from 'react';
import { connect } from 'react-redux';
import store from '../../../ExecutiveReduxStore';

import Dashlet from './Dashlet';

class DashletContainer extends React.Component {
  constructor(props) {
    super(props);
    store.dispatch({
      type: 'DASHLET_CONSTRUCTED',
    });
  }
  render() {
    return (<Dashlet />);
  }
}

const mapStateToProps = (reduxStore) => ({
  dashletData: reduxStore.dashboardState.data,
});

export default connect(mapStateToProps)(DashletContainer);
