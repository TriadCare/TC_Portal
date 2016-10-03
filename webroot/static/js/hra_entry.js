var panelIndex = 0;
var questionPanelList = [];
var $focus;

var optionalQuestions = [23];

$(document).ready(function() {
	
	// break up questionnaire here
	questionPanelList = $(".form-container > form").children().filter(".panel");
	$.each(questionPanelList, function(){
		$(this).toggle();
	});
	
	$(questionPanelList[panelIndex]).toggle(0, focusOnQuestion);
	
	// Register key events
	$(document).keydown(function(event){
		if(event.keyCode == 13) {  // enter
			showNextQuestion();
		  	event.preventDefault();
		  	return false;
		}
		if(event.keyCode == 8) {  // delete
			if($focus.type !== "number" && $focus.type !== "text") {
				showPreviousQuestion();
				event.preventDefault();
				return false;
			}
		}
		
		var $panel = $(questionPanelList[panelIndex]);
		var input = $panel.find("input")[0];
		if(input.type == "radio" || input.type == "checkbox") {

			var keyCode = event.keyCode
			var key = String.fromCharCode(keyCode);
		
			if (keyCode >= 49 && keyCode <= 57){
				var inputs = $panel.find(":input[value=" + key + "]");
		    	inputs.prop("checked", !inputs.prop("checked"));
		    }
		}
		
	});
	
	$(".grid_cell").click(function(e) {
		if(e.target.type == "radio" || e.target.type == "checkbox"){
			return;
		}
		$($(this).children()[0]).click();
		
	});
	$("#tcid_input").keydown(function(){
		if($(this).val().length > 0)
			$("#submitButton").prop("disabled", false);
	});
	
	$("#submitButton").click(function(e){
		var questionIndex = 1;
		// check that each required question has an answer
		if($(":input[name='1']").val() === ""){
			$("#message").show();
			showQuestion(0);  
			e.preventDefault();
			return false;
		} else {
			var completed;
			for(questionIndex = 2; questionIndex <= 77; questionIndex++) {
				completed = false;
				if(questionIndex === 38){ //skip questions 38-63
					questionIndex = 63;
					continue;
				}
				if(questionIndex === 77){ // skip question 77
					continue;
				}
				$(":input[name=" + questionIndex + "]").each(function(){
					if($(this).prop("checked")){
						completed = true;
						return false;
					} 
				});
				if(!completed){
					$("#message").show();
					var i = $($(":input[name=" + questionIndex + "]")[0]).closest('.panel').data("panelIndex");
					showQuestion(i); 
					e.preventDefault();
					return false;
				}
			}
		}
		
	});
	
	$("#nextButton").click(showNextQuestion);
	$("#backButton").click(showPreviousQuestion);
});


var showNextQuestion = function() {
	$("#message").hide();
	if(panelIndex === (questionPanelList.length - 1)) 
		return;
	
	if(optionalQuestions.indexOf(panelIndex) == -1){  //this question is NOT optional
		if($(questionPanelList[panelIndex]).find(":checked").length === 0 && $(questionPanelList[panelIndex]).find(":input[type=number]").length === 0)
			return;
	}
	
	$(questionPanelList[panelIndex]).slideToggle(200);
	panelIndex = panelIndex + 1;
	$(questionPanelList[panelIndex]).slideToggle(200, focusOnQuestion);
	
	
}

var showPreviousQuestion = function() {
	$("#message").hide();
	if(panelIndex === 0) 
		return;
	$(questionPanelList[panelIndex]).slideToggle(200);
	panelIndex = panelIndex - 1;
	$(questionPanelList[panelIndex]).slideToggle(200, focusOnQuestion);
	
}

var showQuestion = function(questionIndex) {
	$(questionPanelList[panelIndex]).slideToggle(200);
	panelIndex = questionIndex;
	$(questionPanelList[panelIndex]).slideToggle(200, focusOnQuestion);
}

var focusOnQuestion = function() {
	$focus = $(questionPanelList[panelIndex]).find("input")[0];
	$focus.focus();
}
