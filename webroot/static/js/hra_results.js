var overall_donut_chart;
var hra_bar_chart;

var export_timer;

var csrftoken = $('meta[name=csrf-token]').attr('content')
var jqxhr = $.ajax({
	type: "POST",
	url: "/hra_data",
	beforeSend: 
		function(xhr, settings){
			if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
		}
	})
	.done(function(data){
		updateChart(data)
	})



$(document).ready(function(){
	// set up the donut and bar chart, will be updated aynchronously
	var donutChartContext = $("#scoreDonutChart").get(0).getContext("2d");
	var barChartContext = $("#scoreBarChart").get(0).getContext("2d");
	
	var emptyDonutChartData = [
		{
			value: 4,
			color: "rgba(220,220,220,0.5)",
			highlight: "rgba(220,220,220,0.75)",
			label: ""
		}
	]
	var emptyBarChartData = {
	    labels: [],
	    datasets: [
	        {
	            label: "User Data",
	            fillColor: "rgba(151,187,205,0.5)",
	            strokeColor: "rgba(151,187,205,0.8)",
	            highlightFill: "rgba(151,187,205,0.8)",
	            highlightStroke: "rgba(151,187,205,1)",
	            data: []
	        },
	        {
	            label: "Triad Care Data",
	            fillColor: "rgba(180,180,180,0.5)",
	            strokeColor: "rgba(180,180,180,0.8)",
	            highlightFill: "rgba(180,180,180,0.8)",
	            highlightStroke: "rgba(180,180,180,1)",
	            data: []
	        }
	    ]
	};
	
	overall_donut_chart = new Chart(donutChartContext).Doughnut(emptyDonutChartData, {
																						"responsive":true, 
																						"maintainAspectRatio":false,
																						"showTooltips":false
																					});
	hra_bar_chart = new Chart(barChartContext).Bar(emptyBarChartData,{
		"responsive":true,
		"maintainAspectRatio":false, 
		"multiTooltipTemplate": "<%= value %>%",
		"scaleOverride": true, 
		"scaleStartValue": 0, 
		"scaleStepWidth": 10, 
		"scaleSteps": 10
		});
			

	//enable the scroll to top button
	$("#top-link-block").click(function(){
		$('html,body').animate({scrollTop:0},'slow');
	});
	
	// Only enable if the document has a long scroll bar
	// Note the window height + offset
	if ( ($(window).height() + 100) < $(document).height() ) {
	    $('#top-link-block').removeClass('hidden').affix({
	        // how far to scroll down before link "slides" into view
	        offset: {top:100}
	    });
	}

});


var gpa_to_percent = function(gpa){
	return ((gpa/4.0)*100).toFixed(0);
}

var get_letter_text = function(grade){
	switch(Math.floor(grade)){
		case 4: return " is an A";
		case 3: return " is a B";
		case 2: return " is a C";
		case 1: return " is a D";
		case 0: return " is an F";
	}
}
	

var updateChart = function(data){
	var overallData = [data['userData']['Overall']]
	delete data['userData']['Overall']
	delete data['tcData']['Overall']
	
	if(overallData[0] === undefined){
		$("#overall_score").text("No Data to Display");
	} else {
		
		var overall_letter_text = get_letter_text(overallData[0]);
		$("#overall_score_title").text("Your Overall Score" + overall_letter_text);
	
		$("#overall_score").text(gpa_to_percent(overallData[0]).toString() + "%");
		
		overall_donut_chart.removeData();
		overall_donut_chart.removeData();  //removed twice to remove both pie sections
		
		overall_donut_chart.addData({
			value: overallData[0],
			color: "rgba(151,187,205,0.5)",
			label: "Overall HRA Score"
		});
		overall_donut_chart.addData({
			value: (4-overallData[0]).toFixed(1),
			color: "rgba(220,220,220,0.5)",
			label: ""
		});
	}

	for(section in data['tcData']){
		hra_bar_chart.addData([gpa_to_percent(data['userData'][section]), gpa_to_percent(data['tcData'][section])], section);
	}
	
	for(bar in hra_bar_chart.datasets[0].bars){
		hra_bar_chart.datasets[0].bars[bar].highlightFill = "rgba(151,187,205,0.8)";
		hra_bar_chart.datasets[0].bars[bar].highlightStroke = "rgba(151,187,205,1)";
	}
	for(bar in hra_bar_chart.datasets[1].bars){
		hra_bar_chart.datasets[1].bars[bar].highlightFill = "rgba(180,180,180,0.8)";
		hra_bar_chart.datasets[1].bars[bar].highlightStroke = "rgba(180,180,180,1)";
	}
	
	hra_bar_chart.datasets[0].label = "Your Score";
	hra_bar_chart.datasets[1].label = "TC Average Score";
	
	hra_bar_chart.update();
	
	$("#scoreBarChart").click(function(e){
		if(hra_bar_chart.getBarsAtEvent(e).length > 0){
			$("body").animate({scrollTop: $("[id = '" + hra_bar_chart.getBarsAtEvent(e)[0]['label'] + "']").position().top - 70}, 1000);
		}
	});

}


/*   This is code that needs to be reviewed before use in production.
var export_to_pdf = function(){
	data = {}
	
	var brandImage = "<img id='tc-brand_img' class='tc-brand' src='/static/media/triadcare_logo.png'/>";
	$("div.tc-brand").after(brandImage);
	var tc_brand_element = $("div.tc-brand");
	$("div.tc-brand").remove();
	
	$("#scorecard_navbar").removeClass("navbar-fixed-top");
	var nav_spacer = $("#nav_bar_spacer");
	$("#nav_bar_spacer").remove();
	
	var user_key_img = "<img id='user_key_img' src='/static/media/user_bar_key.png'/>";
	$("#user_score_key").after(user_key_img);
	$("#user_score_key").remove();
	var tc_key_img = "<img id='tc_key_img' src='/static/media/tc_bar_key.png'/>";
	$("#tc_score_key").after(tc_key_img);
	$("#tc_score_key").remove();
	
	//replace the canvas elements with images.
	//donut
	var donut_canvas = $("#scoreDonutChart");
	var donut_canvasImage = donut_canvas[0].toDataURL("PNG");
	var donut_imgElement = "<img id='donutChartImage' src=" + donut_canvasImage + ">";
	$("#scoreDonutChart").after(donut_imgElement);
	//append the image to the DOM, make sure that in print it is visible and the canvas is not, and in display the image is invisible and the canvas is not.
	$("#scoreDonutChart").remove();
	//bar
	var bar_canvas = $("#scoreBarChart");
	var bar_canvasImage = bar_canvas[0].toDataURL("PNG");
	var bar_imgElement = "<img id='barChartImage' src=" + bar_canvasImage + ">";
	$("#scoreBarChart").after(bar_imgElement);
	$("#scoreBarChart").remove()
	
	//replace all input elements with pictures of the appropriate radio button (LOVE printing)
	$("input[type='number']").after("<span>" + $("input[type='number']").attr("value") + "</span>");
	$("input[type='radio']").each(function(){
		if($(this).attr("checked")){
			$(this).after("<img src='static/media/checked_radio.png'>");
		} else {
			$(this).after("<img src='static/media/unchecked_radio.png'>");
		}
	});
	
	
	data['html'] = $("html").html();
	data['name'] = ($("#questionnaireBreakdownContainer").attr("data-id") || "0000000001") + ".pdf";
	
	var jqxhr = $.ajax({
	type: "POST",
	url: "/export_to_pdf",
	data: data,
	beforeSend: 
		function(xhr, settings){
			if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
		}
	})
	.done(function(response){
		prepare_next_scorecard(response);
	});
	
	//revert the changes to the scorecard
	$("#tc-brand_img").after(tc_brand_element);
	$("#tc-brand_img").remove();
	
	$("#scorecard_navbar").addClass("navbar-fixed-top");
	$("#overall_score_title").before(nav_spacer);
	
	$("#donutChartImage").after(donut_canvas);
	$("#donutChartImage").remove();
	$("#barChartImage").after(bar_canvas);
	$("#barChartImage").remove();
	
}

var prepare_next_scorecard = function(response){
	
	var data = {'id': ($("#questionnaireBreakdownContainer").attr("data-id") || '0000000001')};
	
	$("#questionnaireBreakdownContainer").remove();
	
	var jqxhr = $.ajax({
	type: "POST",
	url: "/get_questionnaire",
	data: data})
	.done(function(response){
		$("#content").append(response);
		$("#hra_results_title").html("<h3>" + $("#questionnaireBreakdownContainer").attr("data-thisname") + "'s HRA Results</h3>")
		
		
		var data = {'id': ($("#questionnaireBreakdownContainer").attr("data-id") || '0000000001')};
		$.ajax({
		type: "POST",
		url: "/hra_data_unprotected",
		data: data
		})
		.done(function(data){
			hra_bar_chart.removeData();
			hra_bar_chart.removeData();
			hra_bar_chart.removeData();
			hra_bar_chart.removeData();
			hra_bar_chart.removeData();  // removed five times, once for each section in the datasets
			updateChart(data);
			export_timer = window.setTimeout(export_to_pdf, 3000);  //3 seconds after the charts are updated, start the process over for this scorecard.
		})
		
		
	});
	
}

*/
