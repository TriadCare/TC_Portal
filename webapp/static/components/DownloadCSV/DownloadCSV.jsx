import React from 'react';
import { CSVDownload } from 'react-csv';

class DownloadCSV extends React.Component {
  componentDidMount() {
    if (typeof this.props.callback === 'function') { this.props.callback(); }
  }
  render = () => (<CSVDownload data={this.props.data} />);
}

DownloadCSV.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.shape()).isRequired,
  callback: React.PropTypes.func,
};

DownloadCSV.defaultProps = { callback: undefined };

export default DownloadCSV;
