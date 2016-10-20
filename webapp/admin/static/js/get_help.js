/* eslint-env node, jquery */

$(document).ready(function () {
	                                        var success = function (data) {
		                                        $('.modal-body').append(data);

		                                        $(document).on('submit', '#help-form', function (e) {
			                                        var data = $(this).serializeArray();

			                                        var csrftoken = $('meta[name=csrf-token]').attr('content');
			                                        var jqxhr = $.ajax({
				                                        type: 'POST',
				                                        url: 'admin/get_help_form',
				                                      data,
				                                        beforeSend(xhr, settings) {
						                                        if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
							                                        xhr.setRequestHeader('X-CSRFToken', csrftoken);
						}
					},
			})
			.done(function (data) {
				                                        try {
					                                        if (JSON.parse(data)) {
						                                        $('#modalCloseButton').click();
						                                        window.location.reload();
					}
				} catch (SyntaxError) { // If not valid JSON, we received HTML for validation.
					                                        $('.modal-body').empty().append(data);
				}
			});

			                                        e.preventDefault();
		});
	};

	                                        $.get('admin/get_help_form', success);
});

var submitHelpForm = function () {
	                                        $('#help-form').submit();
};
