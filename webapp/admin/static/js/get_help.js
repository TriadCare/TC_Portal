/* eslint-env node, jquery */

document.submitHelpForm = () => {
  $('#help-form').submit();
};

$(document).ready(() => {
  const success = (successData) => {
    $('.modal-body').append(successData);

    $(document).on('submit', '#help-form', (e) => {
      const helpFormData = $(this).serializeArray();

      const csrftoken = $('meta[name=csrf-token]').attr('content');
      $.ajax({
        type: 'POST',
        url: 'admin/get_help_form',
        helpFormData,
        beforeSend(xhr, settings) {
          if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
          }
        },
      }).done((doneData) => {
        try {
          if (JSON.parse(doneData)) {
            $('#modalCloseButton').click();
            window.location.reload();
          }
        } catch (SyntaxError) { // If not valid JSON, we received HTML for validation.
          $('.modal-body').empty().append(doneData);
        }
      });

      e.preventDefault();
    });
  };

  $.get('admin/get_help_form', success);
});
