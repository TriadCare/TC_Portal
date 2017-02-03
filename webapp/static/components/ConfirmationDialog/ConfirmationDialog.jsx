import React from 'react';
import { Dialog, Intent, Button } from '@blueprintjs/core';

const ConfirmationDialog = (props) => (
  <Dialog
    autoFocus={props.autoFocus}
    isOpen={props.isOpen}
    iconName={props.iconName}
    onClose={props.onCancel}
    title={props.title}
  >
    <div className="pt-dialog-body">{props.body}</div>
    <div className="pt-dialog-footer">
      <div className="pt-dialog-footer-actions">
        <Button
          onClick={props.onCancel}
          text={props.cancelButtonText || 'Cancel'}
        />
        <Button
          elementRef={(element) => {
            if (element && props.isOpen && props.autoFocus) {
              element.focus();
            }
          }}
          intent={Intent.PRIMARY}
          onClick={props.onConfirm}
          text={props.confirmButtonText || 'Confirm'}
        />
      </div>
    </div>
  </Dialog>
);

ConfirmationDialog.propTypes = {
  autoFocus: React.PropTypes.bool,
  isOpen: React.PropTypes.bool.isRequired,
  iconName: React.PropTypes.string,
  title: React.PropTypes.string,
  body: React.PropTypes.string,
  confirmButtonText: React.PropTypes.string,
  onConfirm: React.PropTypes.func.isRequired,
  cancelButtonText: React.PropTypes.string,
  onCancel: React.PropTypes.func.isRequired,
};

export default ConfirmationDialog;
