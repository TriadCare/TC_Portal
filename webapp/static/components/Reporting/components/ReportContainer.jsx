import moment from 'moment';
import React from 'react';
import { Spinner, Button, Tooltip, Popover,
  Position, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { DateRangeInput } from '@blueprintjs/datetime';

import ReportChart from './ReportChart';
import ReportTable from './ReportTable';

import DownloadCSV from 'components/DownloadCSV';

const getSelectedOption = controlSet =>
  controlSet.options.find(
    o => o.id === controlSet.selectedValue,
  );
const getSelectedOptionID = (controlSet) => {
  const option = getSelectedOption(controlSet);
  if (option === undefined) { return undefined; }
  return option.id;
};

class ReportContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldRenderCSVDownload: false,
      processing: false,
      report: props.report,
      baseControls: props.controls.Base,
      chartControls: props.controls.Chart,
      dataControls: props.controls.Data,
      handleControlChange: (...args) => {
        this.setState({ processing: true });
        this.props.handleControlChange(...args);
      },
    };
  }

  componentWillReceiveProps = (newProps) => {
    this.setState({
      ...this.state,
      ...{
        processing: false,
        report: newProps.report,
        baseControls: newProps.controls.Base,
        chartControls: newProps.controls.Chart,
        dataControls: newProps.controls.Data,
      },
    });
  }

  doesHaveDataFilters = () => {
    const dataFilters = Object.values(this.state.dataControls).filter(
      value => value.options.length > 1,
    );
    return dataFilters.length !== 0;
  }

  renderControlSet = (controlSetName, controlName, controlSet, classNames) => {
    switch (controlSet.type) {
      case 'select':
        return (
          <div className={`pt-select ${classNames}`}>
            <select
              id={`select_${controlName}`}
              className="form-control"
              value={controlSet.selectedValue || 0}
              onChange={e => this.state.handleControlChange(
                controlSetName, controlName, e.target.value,
              )}
            >
              {controlSet.options.map(option =>
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </option>,
              )}
            </select>
          </div>
        );
      case 'dropdown':
        return (
          <Popover
            position={Position.LEFT}
            content={
              <div className={classNames}>
                <Menu>
                  {controlSet.options.map(option =>
                    <MenuItem
                      key={option.id}
                      value={option.id}
                      text={option.label}
                      iconName={option.icon}
                      onClick={() => this.state.handleControlChange(
                        controlSetName, controlName, option.id,
                      )}
                    />)}
                </Menu>
              </div>
            }
          >
            <Button
              className="pt-minimal pt-intent-primary"
              iconName={getSelectedOption(controlSet).icon}
            />
          </Popover>
        );
      case 'datafilter':
        return (
          <MenuItem
            text={getSelectedOption(controlSet) === undefined ?
              'Show All' :
              getSelectedOption(controlSet).label}
          >
            <MenuItem
              text="Show All"
              onClick={() =>
                this.state.handleControlChange(
                controlSetName, controlName, '0',
              )}
              className={
                getSelectedOption(controlSet) === undefined ? 'pt-intent-primary' : ''
              }
            />
            {controlSet.options.map(option =>
              <MenuItem
                key={option.id}
                text={option.label}
                iconName={option.icon}
                onClick={() => this.state.handleControlChange(
                  controlSetName, controlName, option.id,
                )}
                className={getSelectedOptionID(controlSet) === option.id ? 'pt-intent-primary' : ''}
              />)}
          </MenuItem>
        );
      case 'date':
        return (
          <DateRangeInput
            value={[
              (controlSet.min_date === null ?
                null : moment(controlSet.min_date).format('MM/D/YYYY')),
              (controlSet.max_date === null ?
                null : moment(controlSet.max_date).format('MM/D/YYYY')),
            ]}
            onChange={(dateRange) => {
              this.state.handleControlChange(controlSetName, controlName, dateRange);
            }}
            format={'MM/D/YYYY'}
            closeOnSelection
            className={`dateRange__container ${classNames}`}
            endInputProps={{ className: 'form-control-container' }}
            startInputProps={{ className: 'form-control-container' }}
          />
        );
      default:
        return '';
    }
  };

  renderReportHeader = () => (
    <div className="reportHeader">
      <div className="reportTitle">
        <div className="reportTitle__label">{this.state.report.meta.label}</div>
        <div className="baseControlSet baseControlSet-date_range">
          { this.renderControlSet('Base', 'date_range', this.state.baseControls.date_range) }
        </div>
      </div>
      <div className="baseControlSet baseControlSet-data_set">
        <label htmlFor="select_data_set" className="pt-label">
          { this.state.baseControls.data_set.label }
          { this.state.processing && <Spinner className="pt-small" />}
          { this.renderControlSet('Base', 'data_set', this.state.baseControls.data_set) }
        </label>
        { this.doesHaveDataFilters() &&
          <Popover
            position={Position.RIGHT_TOP}
            content={
              <Menu>
                {Object.entries(this.state.dataControls).filter(([key, control]) =>
                  (key !== undefined &&
                    control.options !== undefined &&
                    control.options.length > 1),
                ).map(([key, control], i) =>
                  <div key={key} className="filterMenuGroup">
                    <MenuDivider
                      title={control.label}
                      className={i === 0 ? 'firstMenuDivider' : ''}
                    />
                    {this.renderControlSet('Data', key, control)}
                  </div>,
                )}
              </Menu>
            }
            className="filterButton"
          >
            <Button
              className="pt-minimal pt-intent-primary"
              iconName="filter"
            />
          </Popover> }
      </div>
      <div className="reportToolbar">
        <Tooltip
          content="Export CSV"
          position={Position.LEFT}
          hoverOpenDelay={1000}
          className="exportTooltipWrapper"
        >
          <Button
            iconName="download"
            className="pt-large pt-minimal reportToolbar__button"
            onClick={() => this.setState({ shouldRenderCSVDownload: true })}
          />
        </Tooltip>
      </div>
    </div>
  )

  render() {
    return (
      <div id="reportContainer" className="reportContainer">
        { this.renderReportHeader() }
        <ReportChart
          chartControl={
            this.renderControlSet('Chart', 'chart_type', this.state.chartControls.chart_type)
          }
          chartConfig={this.state.report}
          isFetching={
            this.props.isFetching ||
            this.state.report.reportData === undefined ||
            this.state.report.reportData.length === 0
          }
        />
        <ReportTable
          isFetching={this.props.isFetching}
          data={this.state.report.reportData || []}
          columnDef={this.state.report.columnDef || []}
        />
        {this.state.shouldRenderCSVDownload &&
          <DownloadCSV
            data={this.state.report.reportData}
            callback={() => this.setState({ shouldRenderCSVDownload: false })}
          />
        }
      </div>
    );
  }
}

ReportContainer.propTypes = {
  isFetching: React.PropTypes.bool.isRequired,
  report: React.PropTypes.shape().isRequired,
  controls: React.PropTypes.shape().isRequired,
  handleControlChange: React.PropTypes.func.isRequired,
};

export default ReportContainer;
