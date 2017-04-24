import moment from 'moment';
import React from 'react';
import { Menu, MenuItem, Button,
  InputGroup, Tooltip, Position } from '@blueprintjs/core';
import {
  Table, Column, ColumnHeaderCell, CopyCellsMenuItem,
  Cell, RowHeaderCell, TableLoadingOption,
} from '@blueprintjs/table';
import Pagination from 'react-bootstrap/es/Pagination';

import { oneLine } from 'common-tags';

import DownloadCSV from 'components/DownloadCSV';

const compareDates = (dateOne, dateTwo) => {
  if (dateOne === '') { return -1; }
  if (dateTwo === '') { return 1; }
  return moment(dateOne).diff(dateTwo);
};

class ReportTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      pageOptions: { page: 1, numRecords: 50, pagerMaxButtons: 5 },
      data: props.data,
      columnDef: props.columnDef,
    };
  }

  componentWillReceiveProps = nextProps => this.setState({
    data: nextProps.data,
    columnDef: nextProps.columnDef,
    pageOptions: {
      ...this.state.pageOptions,
      ...{ page: 1 },
    },
  });

  getLoadingOptions = () => {
    const loadingOptions = [];
    if (this.props.isFetching || this.props.data.length === 0) {
      loadingOptions.push(
        ...Object.values(TableLoadingOption).filter(v => v !== 'column-header'),
      );
    }
    return loadingOptions;
  };

  getLoadingColumns = () => {
    const columnArr = this.props.columnDef.map(
      col => <Column key={col.label} name={col.label} />,
    );
    return columnArr;
  }

  getDataStart = () =>
    (this.state.pageOptions.page - 1) * this.state.pageOptions.numRecords;

  getCellKey = (rowIndex, columnIndex) => {
    const dataIndex = this.getDataStart() + rowIndex;
    const columnName = this.state.columnDef[columnIndex].label;

    return `${columnName}_${dataIndex}`;
  }
  getCellValue = (rowIndex, columnIndex) => {
    const dataIndex = this.getDataStart() + rowIndex;
    const item = this.state.data[dataIndex];
    const columnName = this.state.columnDef[columnIndex].label;

    return (item === undefined) ? '' : item[columnName];
  }

  getCell = (rowIndex, columnIndex) => (
    <Cell key={this.getCellKey(rowIndex, columnIndex)}>
      {this.getCellValue(rowIndex, columnIndex)}
    </Cell>
  );

  getColumnHeader = colDef =>
    <ColumnHeaderCell
      name={colDef.label}
      key={colDef.label}
      menu={this.getColumnMenu(colDef)}
    />

  getColumns = () => this.state.columnDef.map(
    col => (
      <Column
        key={col.label}
        renderCell={this.getCell}
        renderColumnHeader={() => this.getColumnHeader(col)}
      />
    ),
  )

  getColumnMenu = (colDef) => {
    const ascIconName = colDef.type === 'date' ? 'sort-numerical' : 'sort-alphabetical';
    const descIconName = colDef.type === 'date' ? 'sort-numerical-desc' : 'sort-alphabetical-desc';
    const sortAsc = colDef.type === 'date' ?
      (a, b) => compareDates(a, b) :
      (a, b) => a.toString().localeCompare(b);
    const sortDesc = colDef.type === 'date' ?
      (a, b) => -compareDates(a, b) :
      (a, b) => -a.toString().localeCompare(b);

    return (
      <Menu>
        {colDef.discrete &&
          <MenuItem iconName="filter" text="Filter">
            {colDef.values.map(v =>
              <MenuItem
                key={v}
                className={colDef.excluded.includes(v) ? '' : 'pt-intent-primary'}
                shouldDismissPopover={false}
                iconName={colDef.excluded.includes(v) ? 'blank' : 'tick'}
                text={v}
                onClick={() => this.handleFilterToggle(colDef.label, v)}
              />,
            )}
          </MenuItem>
        }
        <MenuItem
          iconName={ascIconName}
          text="Sort Asc"
          onClick={() => this.sortColumn(colDef.label, sortAsc)}
        />
        <MenuItem
          iconName={descIconName}
          text="Sort Desc"
          onClick={() => this.sortColumn(colDef.label, sortDesc)}
        />
      </Menu>
    );
  }

  getBodyContextMenu = context =>
    <Menu>
      <CopyCellsMenuItem
        context={context}
        getCellData={this.getCellValue}
        text="Copy"
      />
    </Menu>

  sortColumn = (name, sortFunc) => {
    const sortedData = Array.from(this.state.data);
    sortedData.sort((a, b) => sortFunc(a[name], b[name]));
    this.setState({ data: sortedData });
  }

  // This function the data that is filtered.
  searchData = (searchText = this.state.searchText) =>
    this.filterData().filter(d => Object.values(d).reduce(
      (pass, value) => (value.includes(searchText) || pass), false,
    ));

  // This function filters all of the data based on the currently selected filters in the columnDef
  filterData = (newColumnDef = this.state.columnDef) =>
    this.props.data.filter(d =>
      // filter the columnDef to just discrete columns
      newColumnDef.filter(c => c.discrete).reduce((pass, col) =>
        // reduce the discrete columns dependng on if this data passes or fails
        (!col.excluded.includes(d[col.label]) && pass), true,
      ),
    );

  handleFilterToggle = (colName, value) => {
    const colIndex = this.state.columnDef.findIndex(c => c.label === colName);
    // clone the existing columnDef so that we can update the deep excluded list
    const newColumnDef = this.state.columnDef.map((col, index) => {
      if (col.discrete) {
        return {
          ...this.state.columnDef[index],
          ...{
            excluded: [...this.state.columnDef[index].excluded],
            values: [...this.state.columnDef[index].values],
          },
        };
      }
      return { ...col };
    });

    // update the column excluded list
    if (newColumnDef[colIndex].excluded.includes(value)) {
      newColumnDef[colIndex].excluded = newColumnDef[colIndex].excluded.filter(v => v !== value);
    } else {
      newColumnDef[colIndex].excluded.push(value);
    }

    this.setState({
      columnDef: newColumnDef,
      data: this.filterData(newColumnDef),
    });
  }

  handlePageSelect = (selectedPage) => {
    this.setState({
      pageOptions: {
        ...this.state.pageOptions,
        ...{ page: selectedPage },
      },
    });
  }

  render() {
    return (
      <div className="reportElement reportTable">
        <div className="reportTable__controlPanel reportTable__header">
          <InputGroup
            className="pt-round"
            value={this.state.searchText}
            placeholder="Search..."
            leftIconName="search"
            onChange={e => this.setState({
              searchText: e.target.value,
              data: this.searchData(e.target.value),
              pageOptions: {
                ...this.state.pageOptions,
                ...{
                  page: 1,
                },
              },
            })}
            rightElement={
              this.state.searchText.length > 0 ?
                <Button
                  iconName="small-cross"
                  className="pt-minimal"
                  onClick={() => this.setState({
                    searchText: '',
                    data: this.searchData(''),
                    pageOptions: {
                      ...this.state.pageOptions,
                      ...{
                        page: 1,
                      },
                    },
                  })}
                /> :
                <Button iconName="blank" className="pt-minimal pt-disabled hiddenButton" />
            }
          />
          <Tooltip content="Export Table Data to CSV" position={Position.LEFT}>
            <DownloadCSV
              icon
              text={false}
              data={this.state.data}
              headers={this.state.columnDef.map(col => col.label)}
            />
          </Tooltip>
        </div>
        <Table
          numRows={this.state.data.length === 0 ?
            this.state.pageOptions.numRecords :
            Math.min(this.state.data.length, this.state.pageOptions.numRecords)}
          renderRowHeader={rowIndex =>
            <RowHeaderCell
              key={rowIndex}
              name={this.getDataStart() + rowIndex + 1}
            />
          }
          loadingOptions={this.getLoadingOptions()}
          renderBodyContextMenu={this.getBodyContextMenu}
          getCellClipboardData={this.getCellValue}
        >
          { this.props.data.length === 0 ?
          this.getLoadingColumns() :
          this.getColumns() }
        </Table>
        <div className="reportTable__controlPanel reportTable__footer">
          <div className="recordLabel">
            {oneLine`
              Showing ${this.getDataStart() + 1}
               to ${Math.min(this.getDataStart() + this.state.pageOptions.numRecords, this.state.data.length)}
               of ${this.state.data.length}`}
          </div>
          <Pagination
            prev
            next
            ellipsis
            boundaryLinks
            items={Math.ceil(this.state.data.length / this.state.pageOptions.numRecords)}
            maxButtons={this.state.pageOptions.pagerMaxButtons}
            activePage={this.state.pageOptions.page}
            onSelect={this.handlePageSelect}
          />
        </div>
      </div>
    );
  }
}

ReportTable.propTypes = {
  isFetching: React.PropTypes.bool,
  data: React.PropTypes.arrayOf(React.PropTypes.shape()),
  columnDef: React.PropTypes.arrayOf(React.PropTypes.shape()).isRequired,
};

ReportTable.defaultProps = {
  isFetching: true,
  data: [],
};

export default ReportTable;
