import React from 'react';
import { connect } from 'react-redux';

import { IdentityActions } from 'components/Identity';

import './css/Reporting';

import ReportContainer from './components/ReportContainer';

class Reporting extends React.Component {

  // Make the request when the component is mounted.
  // Should use cached data if within expiration time
  componentDidMount = () => {
    IdentityActions.requestData('hras');
    // store.dispatch({
    //   type: MAKE_REQUEST,
    //   action: GET_HRAS_REQUEST,
    //   request: new Request('/hras?Account=57'),
    //   callback: (response) => store.dispatch({
    //     type: GET_HRAS_RESPONSE,
    //     response,
    //   }),
    // });
  }

  render() {
    const datasetList = [];
    Object.keys(this.props.datasets).forEach((key) => {
      datasetList.push({
        id: this.props.datasets[key].id,
        title: this.props.datasets[key].title,
      }
      );
    });

    return (
      <div className="spaceComponent reportingComponent">
        {this.props.reports.map((report) => (
          <ReportContainer
            key={report.id}
            reportLabel={report.label}
            reportConfig={report.config}
            configOptions={
              Object.assign(
                {},
                this.props.chartConfiguration.Base,
                this.props.chartConfiguration[report.config.chart_type]
              )
            }
            dataset={this.props.datasets[report.dataset]}
            datasetList={datasetList}
          />
        ))}
      </div>
    );
  }
}

Reporting.propTypes = {
  chartConfiguration: React.PropTypes.object.isRequired,
  reports: React.PropTypes.array.isRequired,
  datasets: React.PropTypes.object.isRequired,
};


const mapStateToProps = (reduxStore) => ({
  chartConfiguration: reduxStore.reportingState.chartConfiguration,
  reports: reduxStore.reportingState.reports,
  datasets: reduxStore.reportingState.datasources,
});

export default connect(mapStateToProps)(Reporting);
