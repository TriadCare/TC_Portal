import { connect } from 'react-redux';

import { IdentityActions } from 'components/Identity';
import BaseLayout from 'components/BaseLayout';
import { refreshData } from '../PatientActions';

const mapDispatchToProps = (dispatch) => ({
  onLogin: () => refreshData(),
  onLogout: () => {
    dispatch(IdentityActions.invalidateJWT());
    location.href = '/';
  },
});

export default connect(() => ({}), mapDispatchToProps)(BaseLayout);
