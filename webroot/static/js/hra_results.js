var overall_donut_chart;
var hra_bar_chart;

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
		"maintainAspectRatio":false 
		//"multiTooltipTemplate": "<%= datasetLabel %>: <%= value %>"
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

	

var updateChart = function(data){
	var overallData = [data['userData']['Overall']]
	delete data['userData']['Overall']
	delete data['tcData']['Overall']
	
	if(overallData[0] === undefined){
		$("#overall_score").text("No Data to Display");
	} else {
	
		$("#overall_score").text(overallData[0])
		
		overall_donut_chart.removeData()
		
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
		hra_bar_chart.addData([data['userData'][section], data['tcData'][section]], section)
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