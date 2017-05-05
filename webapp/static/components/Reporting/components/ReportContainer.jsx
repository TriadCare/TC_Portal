import moment from 'moment';
import React from 'react';
import { Spinner, Button, Popover, Tooltip,
  Position, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { DatePicker } from '@blueprintjs/datetime';

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

const getDateRange = (oldMin, oldMax, newMin, newMax) => {
  if (newMin === null) {
    return moment(newMax).isBefore(oldMin) ?
      [moment(newMax), moment(newMax)] :
      [moment(oldMin), moment(newMax)];
  }
  return moment(newMin).isAfter(oldMax) ?
    [moment(newMin), moment(newMin)] :
    [moment(newMin), moment(oldMax)];
};

class ReportContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
          <div className="dateInputGroup">
            <Popover
              position={Position.BOTTOM_LEFT}
              content={
                <DatePicker
                  canClearSelection={false}
                  value={(controlSet.min_date === null ? null :
                    moment(controlSet.min_date).toDate())}
                  onChange={date => this.state.handleControlChange(
                    controlSetName, controlName, getDateRange(
                      this.state.baseControls.date_range.min_date,
                      this.state.baseControls.date_range.max_date,
                      date, null,
                    ))
                  }
                />
              }
            >
              <Button
                className="pt-minimal pt-intent-primary dateButton"
                text={(controlSet.min_date === null ? null :
                  moment(controlSet.min_date).format('MMM Do, YYYY'))}
              />
            </Popover>
            <span className="pt-icon-standard pt-icon-arrow-right" />
            <Popover
              position={Position.BOTTOM_LEFT}
              content={
                <DatePicker
                  canClearSelection={false}
                  value={(controlSet.max_date === null ? null :
                    moment(controlSet.max_date).toDate())}
                  onChange={date => this.state.handleControlChange(
                    controlSetName, controlName, getDateRange(
                      this.state.baseControls.date_range.min_date,
                      this.state.baseControls.date_range.max_date,
                      null, date,
                    ))
                  }
                />
              }
            >
              <Button
                className="pt-minimal pt-intent-primary dateButton"
                text={(controlSet.max_date === null ? null :
                  moment(controlSet.max_date).format('MMM Do, YYYY'))}
              />
            </Popover>
          </div>
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
              <Tooltip content="Filter this Data Set" position={Position.LEFT}>
                <Button
                  className="pt-minimal pt-intent-primary"
                  iconName="filter"
                />
              </Tooltip>
            </Popover> }
        </label>
      </div>
      <div className="reportToolbar">
        {this.state.report.data.length !== 0 && (
          <DownloadCSV
            data={this.state.report.data}
            headers={this.state.report.columnDef.map(col => col.label)}
            classNames="pt-large"
          />
        )}
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
            this.state.report.data === undefined ||
            this.state.report.data.length === 0
          }
        />
        <ReportTable
          isFetching={this.props.isFetching}
          data={this.state.report.data || []}
          columnDef={this.state.report.columnDef || []}
        />
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
