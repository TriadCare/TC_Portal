var timelineChart;
hras = {};
hraCharts = {};

var csrftoken = $('meta[name=csrf-token]').attr('content');
var jqxhr = $.ajax({
	type: "POST",
	url: "/get_hra_data",
	beforeSend: 
		function(xhr, settings){
			if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
		}
}).done(function(data) { init(data.data) });

var init = function(data) {
	var needsNewHRA = true;
	
	hra_timeline(data);
	
	// build the HRA card container (need to reverse data because I need the scroll container to start from right.)
	$.each(data.reverse(), function(index, hra) {
		var timeCreated = new Date(hra.DATE_CREATED).getTime();
		var timestamp = new Date().getTime() - (9 * 30 * 24 * 60 * 60 * 1000) // 9 months ago
		if (timeCreated > timestamp) {  // if an HRA has been taken in 9 months, the user does not need to take a new one.
			needsNewHRA = false;
		}
		
		var cardHTML = "";
		var buttonHTML = "";
		var incomplete = false;
		
		if (hra.completed !== 1) {  // incomplete HRA
			buttonHTML = 	"<button title='Complete Assessment' \
								type='button' \
								class='btn btn-default btn-xs card-scorecard-button' \
								data-rid='" + hra.responseID + "' \
								aria-label='Complete Assessment'> \
								<span class='glyphicon glyphicon-edit tc-icon' aria-hidden='true'></span> \
							</button>";
			incomplete = true;
		} else {
			buttonHTML = 	"<button title='Go To Scorecard' \
								type='button' \
								class='btn btn-default btn-xs card-scorecard-button' \
								data-rid='" + hra.responseID + "' \
								aria-label='Go To Scorecard'> \
								<span class='glyphicon glyphicon-stats tc-icon' aria-hidden='true'></span> \
							</button>"; 
			
		}
		
		cardHTML = "<div id='hra-card-" + index + "' class='hra-card panel panel-default'> \
						<div class='panel-heading hra-card-header'> \
							<span class='card-date-label'>" + formatDateString(hra.DATE_CREATED) + "</span> \
							" + buttonHTML + " \
						</div> \
						<div class='chart-container'> \
							<canvas id='hra-card-chart-" + hra.responseID + "' width='90%' height='90%'></canvas> \
						</div> \
					</div>";	
									
		$("#card-container").append(cardHTML);
		
		var chartContext = $("#hra-card-chart-" + hra.responseID).get(0).getContext("2d");
		var chart = new Chart(chartContext).Doughnut([
			{
				value: incomplete ? null : hra.Overall,
				color: "rgba(151,187,205,0.5)",
				label: "Overall HRA Score"
			},
			{
				value: incomplete ? 4 : (4-hra.Overall).toFixed(1),
				color: "rgba(220,220,220,0.5)",
				label: ""
			}
		], 
		{
			"responsive":true,
			"maintainAspectRatio":false,
			"showTooltips":false,
			"onAnimationComplete": function() {
				var incomplete = hra.completed !== 1;
				
				var chart = hraCharts[hra.responseID];
				var ctx = chart.chart.ctx;
				
			    ctx.font = (incomplete ? "20px " : "24px ") + chart.options.scaleFontFamily;
			    ctx.fillStyle = "#0078b9";
			    ctx.textAlign = "center";
			    ctx.textBaseline = "middle";
			    
			    var score = incomplete ? "Incomplete" : gpa_to_percent(hra.Overall).toString() + "%";
			    
				ctx.fillText(score, chart.chart.width/2, chart.chart.height/2);
			}
		});
		
		hraCharts[hra.responseID] = chart;
		hras[hra.responseID] = hra;
	});
	
	//add a new HRA card if needed
	if(needsNewHRA) {
		var newHRACard =	"<div id='hra-card-" + -1 + "' class='hra-card panel panel-default'> \
								<div class='panel-heading hra-card-header'> \
									<span class='card-date-label'>" + formatDateString(new Date()) + "</span> \
									<button title='Start New Assessment' \
										type='button' \
										class='btn btn-default btn-xs card-scorecard-button' \
										data-rid='-1' \
										aria-label='Start New Assessment'> \
										<span class='glyphicon glyphicon-plus tc-icon' aria-hidden='true'></span> \
									</button> \
								</div> \
								<div class='chart-container'> \
									<div class='new-hra-body'> \
										<span class='new-hra-label'>New Assessment</span> \
									</div> \
								</div> \
							</div>";
		
		$("#card-container").prepend(newHRACard);
	}
	
	//register card click events
	$(".card-scorecard-button").on("click", function(){
		var responseID = $(this).data("rid");
		var url = "";
		
		if(responseID !== -1 && hras[responseID].completed === 1) {  //completed HRA
			url = "/go_to_scorecard/" + hras[responseID].responseID;
		} else { // new or incomplete HRA
			url = "/hra";
		}
		
		window.location.href = url;
	});
}

var hra_timeline = function(hra_data) {
	chartData = [];
	labels = [];
	
	$.each(hra_data, function(index, hra) {
		var hra_date = new Date(hra.DATE_CREATED);
		labels.push(hra_date.getFullYear());
		if(hra.completed === 1) {
			chartData.push(gpa_to_percent(hra.Overall));
		} else {
			chartData.push(null);
		}
	});
	
	labels.unshift(labels[0]-1);
	labels.push(labels[labels.length-1]+1);
	chartData.unshift(null);
	
	var timelineChartContext = $("#hra-timeline-chart").get(0).getContext("2d");
	timelineChart = new Chart(timelineChartContext).Line(
		{
			labels: labels,
			datasets: [{ 
				data: chartData,
				
				label: "Trending Overall",
				fillColor: "rgba(151,187,205,0.5)",
	            strokeColor: "rgba(151,187,205,0.8)",
				pointColor : "rgba(220,220,220,1)",
				pointStrokeColor : "#fff",
				pointHighlightFill : "#fff",
				pointHighlightStroke : "rgba(220,220,220,1)",
				datasetFill : false,
			}]
		},
		{	
			"responsive":true,
			"maintainAspectRatio":false, 
			"multiTooltipTemplate": "<%= value %>%",
			"scaleOverride": true, 
			"scaleStartValue": 0, 
			"scaleStepWidth": 10, 
			"scaleSteps": 10,
			"showTooltips": false,
			"onAnimationComplete": renderChartValues
		}
	);
	
}


var gpa_to_percent = function(gpa){
	return ((gpa/4.0)*100).toFixed(0);
}

var get_letter_text = function(grade){
	if (grade >= 90) return " is an A";
	if (grade >= 80) return " is a B";
	if (grade >= 70) return " is a C";
	if (grade >= 60) return " is a D";
	return " is an F";
}

var formatDateString = function(dateString) {
	var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
	d = new Date(dateString);
	
	var dayOfMonth = d.getDate();
	var dayOfWeek = d.getDay();
	var month = d.getMonth();
	var year = d.getFullYear();
	
	return days[dayOfWeek] + " " + months[month] + " " + dayOfMonth + ", " + year;
}

var renderChartValues = function(){
	var ctx = timelineChart.chart.ctx;
    ctx.font = timelineChart.scale.font;
    ctx.fillStyle = "#0078b9";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    timelineChart.datasets.forEach(function (dataset) {
        dataset.points.forEach(function (point) {
	        if(point.value){
	            ctx.fillText(point.value, point.x, point.y-5);
	        }
        });
    })
}

/*
$(document).ready(function(){
	// set up the donut and bar chart, will be updated aynchronously
	var donutChartContext = $("#scoreDonutChart").get(0).getContext("2d");
	
	var emptyDonutChartData = [
		{
			value: 4,
			color: "rgba(220,220,220,0.5)",
			highlight: "rgba(220,220,220,0.75)",
			label: ""
		}
	]
		
	overall_donut_chart = new Chart(donutChartContext).Doughnut(emptyDonutChartData, {
																						"responsive":true, 
																						"maintainAspectRatio":false,
																						"showTooltips":false
																					});


});





var get_chart_text = function(value){
	if (value >= 90) return value + " | A";
	if (value >= 80) return value + " | B";
	if (value >= 70) return value + " | C";
	if (value >= 60) return value + " | D";
	return value + " | F";
}


var updateChart = function(data){
	var overallData = [data['userData']['Overall']]
	delete data['userData']['Overall']
	delete data['tcData']['Overall']
	
	if(overallData[0] === undefined){
		$("#overall_score").text("No Data to Display");
	} else {
		var overall_percentage = gpa_to_percent(overallData[0]);
		var overall_letter_text = get_letter_text(overall_percentage);
		
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

}
*/


