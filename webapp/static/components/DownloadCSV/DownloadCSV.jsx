import React from 'react';
import { CSVLink } from 'react-csv';

import { Popover, Position, InputGroup, Button } from '@blueprintjs/core';

import './css/DownloadCSV.css';

const defaultFilename = 'download';

class DownloadCSV extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      filename: '',
      data: props.data,
      headers: props.headers,
    };
  }

  componentWillReceiveProps = newProps => this.setState({
    filename: newProps.filename || this.state.filename,
    data: newProps.data,
    headers: newProps.headers,
  })

  handleFileNameChange = filename => this.setState({ filename })

  downloadBox = () => (
    <form
      className="downloadBox"
      onSubmit={(e) => {
        e.preventDefault();
        this.downloadButton.buttonRef.click();
        this.setState({ isOpen: false });
      }}
    >
      <label className="pt-label" htmlFor="downloadFilename">
        File Name
        <InputGroup
          inputRef={(c) => { this.filenameInput = c; }}
          id="downloadFilename"
          type="text"
          dir="auto"
          placeholder={defaultFilename}
          value={this.state.filename}
          onChange={e => this.handleFileNameChange(e.target.value)}
          rightElement={
            <CSVLink
              data={this.state.data}
              headers={this.state.headers}
              filename={`${(this.state.filename || defaultFilename)}.csv`}
            >
              <Button
                ref={(c) => { this.downloadButton = c; }}
                className="pt-minimal"
                iconName="download"
                onClick={() => this.setState({ isOpen: false })}
              />
            </CSVLink>
          }
        />
      </label>
    </form>
  )

  render = () => (
    <Popover
      position={Position.LEFT_TOP}
      content={this.downloadBox()}
      isOpen={this.state.isOpen}
      onInteraction={(focused) => {
        if (!focused) {
          this.setState({ isOpen: false });
        }
      }}
      popoverDidOpen={() => {
        this.filenameInput.focus();
      }}
    >
      <Button
        text={this.props.text ? 'Export' : null}
        iconName={this.props.icon ? 'download' : ''}
        className={
          `pt-minimal pt-intent-primary exportButton ${this.props.classNames}`
        }
        onClick={() => this.setState({ isOpen: true })}
      />
    </Popover>
  );
}

DownloadCSV.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.shape()),
  headers: React.PropTypes.arrayOf(React.PropTypes.string),
  text: React.PropTypes.bool,
  icon: React.PropTypes.bool,
  classNames: React.PropTypes.string,
};

DownloadCSV.defaultProps = {
  data: [],
  headers: undefined,
  text: true,
  icon: false,
  classNames: '',
};

export default DownloadCSV;
