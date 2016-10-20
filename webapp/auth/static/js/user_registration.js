$(document).ready(function(){
	//activate popovers on this page. Options are defined in the html template.
	$("#password").popover();
	$("#confirm_password").popover();
	$("#dob").popover();

	$(".form-dob").change(function(){
		if ($(this).val() < 0)
			$(this).val(0);
	});
})
