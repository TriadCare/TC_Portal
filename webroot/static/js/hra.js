var saveHRA = function(){
	
	hra_data = $("form[name='hra']").serializeArray();
	
	$.post("/save_hra", hra_data, function(){alert("Your answers have veen saved.");});
	
}