import React from 'react';
import { connect } from 'react-redux';

import { IdentityActions } from 'components/Identity';
import BaseLayout from 'components/BaseLayout';
import { refreshData } from '../ExecutiveActions';

import Navigation from './ExecutiveNavigation';

const mapStateToProps = () => ({
  navigationComponent: <Navigation
    links={[
      {
        id: 1,
        label: 'Dashboard',
        uri: '/executive/dashboard',
        icon: 'dashboard',
      },
      {
        id: 2,
        label: 'Reporting',
        uri: '/executive/reporting',
        icon: 'th',
      },
    ]}
  />,
});

const mapDispatchToProps = dispatch => ({
  onLogin: () => refreshData(),
  onLogout: () => {
    dispatch(IdentityActions.invalidateJWT());
    location.href = '/';
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BaseLayout);
