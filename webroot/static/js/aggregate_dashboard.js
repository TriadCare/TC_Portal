var timelineChart;
hras = {};
hraCharts = {};

var csrftoken = $('meta[name=csrf-token]').attr('content');
$.ajax({
	type: "POST",
	url: "/get_aggregate_hra_data/" + $("#hra_results_title").data('account'),
	beforeSend: 
		function(xhr, settings){
			if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
		}
}).done(function(data) { init(data.data) });

$.ajax({
	type: "POST",
	url: "/get_hra_participation_data/" + $("#hra_results_title").data('account'),
	beforeSend: 
		function(xhr, settings){
			if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
		}
}).done(function(data) { renderParticipationTable(data.data) });

var init = function(data) {	
	hra_timeline(data);
	
	// build the HRA card container (need to reverse data because I need the scroll container to start from right.)
	$.each(data, function(index, hra) {
		chartLabelText = "Your Overall Score" + get_letter_text(gpa_to_percent(hra.section_scores.Overall));
		titleText = "Go To Scorecard";
		
		cardHTML = "<div title='" + titleText + "' id='hra-card-" + index + "' class='hra-card panel panel-default' data-year='" + index + "'> ";
		cardHTML += "				<div class='panel-heading hra-card-header'> ";
		cardHTML += "					<div class='card-label-container'> ";
		cardHTML += "						<div class='aggregate-card-date-label'>" + index + "</div> ";
		cardHTML += "						<div class='completes-label'>" + hra.total_completed + " completes</div> ";
		cardHTML += "					</div> ";
		cardHTML += "				</div> ";
		cardHTML += "				<div class='chart-label'>" + chartLabelText + "</div> ";
		cardHTML += "				<div class='chart-container'> ";
		cardHTML += "					<canvas id='hra-card-chart-" + index + "' width='90%' height='90%'></canvas> ";
		cardHTML += "				</div> ";
		cardHTML += "			</div>";	
									
		$("#card-container").prepend(cardHTML);
		
		var chartContext = $("#hra-card-chart-" + index).get(0).getContext("2d");
		var chart = new Chart(chartContext).Doughnut([
			{
				value: hra.section_scores.Overall,
				color: "rgba(151,187,205,0.5)",
				label: "Overall HRA Score"
			},
			{
				value: (4-hra.section_scores.Overall).toFixed(1),
				color: "rgba(220,220,220,0.5)",
				label: ""
			}
		], 
		{
			"responsive":true,
			"maintainAspectRatio":false,
			"showTooltips":false,
			"onAnimationComplete": function() {
				
				var chart = hraCharts[index];
				var ctx = chart.chart.ctx;
				
			    ctx.font = "24px " + chart.options.scaleFontFamily;
			    ctx.fillStyle = "#0078b9";
			    ctx.textAlign = "center";
			    ctx.textBaseline = "middle";
			    
			    var score = gpa_to_percent(hra.section_scores.Overall).toString() + "%";
			    
				ctx.fillText(score, chart.chart.width/2, chart.chart.height/2);
			}
		});
		
		hraCharts[index] = chart;
		hras[index] = hra;
	});
	
	
	//register card click events
	$(".hra-card").on("click", function(){		
		window.location.href = "/aggregate_scorecard/" + $("#hra_results_title").data('account') + "/" + $(this).data("year");
	});
}


var hra_timeline = function(hra_data) {
	chartData = [];
	labels = [];
	
	$.each(hra_data, function(index, hra) {
		labels.push(parseInt(index));
		chartData.push(gpa_to_percent(hra.section_scores.Overall));
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

var renderParticipationTable = function(data){
	var userCount = data.user_count;
	var participationData = data.data;
	
	var tableHTML = "<table id='participation-table' class='table table-striped table-hover table-condensed table-responsive'>";
	tableHTML += "<thead><tr><th class='completed-column'>Completed</th><th>First Name</th><th>Last Name</th><th>Email</th></tr></thead><tbody>"
	
	$.each(participationData, function(index, row) {
		tableHTML += "<tr>";
		tableHTML += "<td class='completed-column'>" + (row.completed === 1 ? "Yes" : "No") + "</td>";
		tableHTML += "<td>" + row.first_name + "</td>";
		tableHTML += "<td>" + row.last_name + "</td>";
		tableHTML += "<td>" + row.email + "</td>";
		tableHTML += "</tr>";
	});
	
	tableHTML += "</tbody></table>";
	
	$("#participation-container").html(tableHTML);
	$("#participation-container-footer").html("<div>Total Users: " + userCount + "</div>");
	
	$("#participation-table").DataTable();
	
	
	//register click events
	$("#participation-download-button").on("click", function(){
		var csvContent = "data:text/csv;charset=utf-8,Completed,First Name,Last Name,Email\n";
		var rowValues = [];
		$.each(data.data, function(index, item){
			rowValues = [(item.completed === 1 ? "Yes" : "No"), item.first_name, item.last_name, item.email]
			csvContent += rowValues.join(",") + "\n";
		}); 
		var encodedUri = encodeURI(csvContent);
		window.open(encodedUri);
	});
}



