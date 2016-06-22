var saveHRA = function(){
	
	hra_data = $("form[name='hra']").serializeArray();
	
	$.post("save_hra", hra_data, function(){window.location.replace("/login");});
	
}

var spanishHRA = function(){
	
	var csrftoken = $('meta[name=csrf-token]').attr('content')
	var jqxhr = $.ajax({
		type: "POST",
		url: "spanish_hra",
		beforeSend: 
			function(xhr, settings){
				if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
					xhr.setRequestHeader("X-CSRFToken", csrftoken);
				}
			}
		})
		.done(function(data){
			window.location.reload();
		})
	
}

var englishHRA = function(){
	
	var csrftoken = $('meta[name=csrf-token]').attr('content')
	var jqxhr = $.ajax({
		type: "POST",
		url: "english_hra",
		beforeSend: 
			function(xhr, settings){
				if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
					xhr.setRequestHeader("X-CSRFToken", csrftoken);
				}
			}
		})
		.done(function(data){
			window.location.reload();
		})
	
}

$(document).ready(function() {
  $(window).keydown(function(event){
    if(event.keyCode == 13 || event.keyCode == 8) {  // enter or delete keys
      event.preventDefault();
      return false;
    }
  });
});