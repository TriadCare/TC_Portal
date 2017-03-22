import React from 'react';
import {
  Table, Column, ColumnHeaderCell, CopyCellsMenuItem,
  IMenuContext, Cell, RowHeaderCell, TableLoadingOption,
} from '@blueprintjs/table';
import Pagination from 'react-bootstrap/es/Pagination';

import { oneLine } from 'common-tags';

class ReportTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageOptions: { page: 1, numRecords: 50, pagerMaxButtons: 5 },
      data: props.data,
    };
  }

  componentWillReceiveProps = nextProps => this.setState({
    data: nextProps.data,
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
    const columnName = Object.keys(this.state.data[0])[columnIndex];

    return `${columnName}_${dataIndex}`;
  }
  getCellValue = (rowIndex, columnIndex) => {
    const dataIndex = this.getDataStart() + rowIndex;
    const item = this.state.data[dataIndex];
    const columnName = Object.keys(this.state.data[0])[columnIndex];

    return (item === undefined) ? '' : item[columnName];
  }

  getCell = (rowIndex, columnIndex) => (
    <Cell key={this.getCellKey(rowIndex, columnIndex)}>
      {this.getCellValue(rowIndex, columnIndex)}
    </Cell>
  );

  getColumns = () => Object.keys(this.state.data[0]).map(
    k => (
      <Column
        key={k}
        name={k}
        renderCell={this.getCell}
      />
    ),
  )

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
};

ReportTable.defaultProps = {
  isFetching: true,
  data: [],
};

export default ReportTable;
