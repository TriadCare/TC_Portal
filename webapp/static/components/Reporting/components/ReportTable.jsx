import moment from 'moment';
import React from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';
import {
  Table, Column, ColumnHeaderCell, CopyCellsMenuItem,
  Cell, RowHeaderCell, TableLoadingOption,
} from '@blueprintjs/table';
import Pagination from 'react-bootstrap/es/Pagination';

import { oneLine } from 'common-tags';

const compareDates = (dateOne, dateTwo) => {
  if (dateOne === '') { return -1; }
  if (dateTwo === '') { return 1; }
  return moment(dateOne).diff(dateTwo);
};

class ReportTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
      loadingOptions.push(...Object.values(TableLoadingOption));
    }
    return loadingOptions;
  };

  getLoadingColumns = () =>
    [...Array(5).keys()].map(
      k => <Column key={k} name={k} />,
    )

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
        onCopy={b => console.log(b)}
        text="Copy"
      />
    </Menu>

  sortColumn = (name, sortFunc) => {
    const sortedData = Array.from(this.state.data);
    sortedData.sort((a, b) => sortFunc(a[name], b[name]));
    this.setState({ data: sortedData });
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
          { this.state.data.length === 0 ?
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
