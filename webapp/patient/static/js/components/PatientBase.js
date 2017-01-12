import { connect } from 'react-redux';

import BaseLayout from 'components/BaseLayout';
import { refreshData } from '../PatientActions';

const mapDispatchToProps = () => ({
  onLogin: () => refreshData(),
});

export default connect(mapDispatchToProps)(BaseLayout);
