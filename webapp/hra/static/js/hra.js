var saveHRA = function(){
	
	hra_data = $("form[name='hra']").serializeArray();
	
	$.post("save", hra_data, function(){window.location.replace("/login");});
	
}

var spanishHRA = function(){
	
	var csrftoken = $('meta[name=csrf-token]').attr('content')
	var jqxhr = $.ajax({
		type: "POST",
		url: "spanish",
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
		url: "english",
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
  	$('input').keydown(function(event){
    	if(event.keyCode == 13) {  // enter key
			event.preventDefault();
			return false;
    	}
    
		if(this.type === 'radio' || this.type === 'checkbox'){
	    	if(event.keyCode == 8) {	// delete key
		    	event.preventDefault();
		    	return false;
	    	}
		}
  });
});