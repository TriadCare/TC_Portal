import { connect } from 'react-redux';

import { IdentityActions } from 'components/Identity';
import BaseLayout from 'components/BaseLayout';
import { refreshData } from '../ExecutiveActions';

const mapDispatchToProps = dispatch => ({
  onLogin: () => refreshData(undefined, true),
  onLogout: () => {
    dispatch(IdentityActions.invalidateJWT());
    location.href = '/';
  },
});

export default connect(() => ({}), mapDispatchToProps)(BaseLayout);
