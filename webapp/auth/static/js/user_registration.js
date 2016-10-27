/* eslint-env node, jquery */

$(document).ready(() => {
	// activate popovers on this page. Options are defined in the html template.
  $('#password').popover();
  $('#confirm_password').popover();
  $('#dob').popover();

  $('.form-dob').change(() => {
    if ($(this).val() < 0) {
      $(this).val(0);
    }
  });
});
