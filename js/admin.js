$(document).ready(function(){
    // Player infomation
    var game_id = +getParameterByName('game_id');
    var admin_key = +getParameterByName('admin_key');
    // Query parameter used in connection
    var connect_parameters = 'admin_key=' + admin_key + '&game_id=' + game_id;

    // Display the game id
    var pBox = document.getElementById("gameIdNumber");
    pBox.innerHTML = 'Numero de Partida: ' +  game_id;
    //waitingDiv.appendChild(row);
    $('#waitingPlayersModal').modal('show');

    
    // Connect to the Socket.IO server.
    var url_base = "http://127.0.0.1:5000";
    var namespace = '/admin';
    var socket = io.connect(url_base + namespace,
			    {query:connect_parameters});

    // Event handler for new connections.
    // The callback function is invoked when a connection
    // with the server is established.
    socket.on('connect', function() {
	console.log("me conecte");
    });

    // Event handler for server sent data.
    // Modal waiting players
    socket.on('connecting_players', function(data) {
	waitingPlayers(data);
    });
    
    // General infomation of all player.
    socket.on('game_information', function(game) {
	console.log(game);
    });

});


function waitingPlayers(data) {
    /*
      Update the waiting players modal.
    */
    if (data['start_game'] == false){
	var waitingDiv = document.getElementById('waitingPlayers');
	while (waitingDiv.firstChild) {
	    waitingDiv.removeChild(waitingDiv.firstChild);
	}

	var rowDiv = document.createElement('div');
	rowDiv.className = 'row';
	
	// Create player status img
	for (var i=0; i < data['players_ready'].length; i++) {
	    var div = document.createElement('div');
	    div.className = 'col-xs-6 col-sm-3 col-md-2';

	    if (data['players_ready'][i]) {
		var text = '<p class="waitingSquare">Listo</p>';
	    }
	    else {
		var text = '<p class="waitingSquare">Esperando</p>';
	    }
	    div.innerHTML = text;
	    //rowDiv.appendChild(div);
	    waitingDiv.appendChild(div);
	}
    }
    // If all player are ready, hide the modal
    else {
	$(".waiting-background").remove();
	$('#waitingPlayersModal').modal('hide');

	// create the div of the plots and the data table
	// for each player
	var playersData = document.getElementById('playersData');

	for (var i=0; i < data['players_ready'].length; i++) {
	    var divTable = document.createElement('div');
	    divTable.className = "";
	    divTable.id = "";
	}
    }
}


function generatePlayersBoxs(game) {
    var playersData = document.getElementById('playersData');
    // Remove all element in the list
    while (playersData.firstChild) {
	playersData.removeChild(playersData.firstChild);
    }

    for (var i = 0;  i < game['players'].length; i++){
	
    }
}












function playerDataTable(data) {
    /*
      Generate the table and the plot of the player play.
    */
    var tableDiv = document.getElementById('dataTable');
    while (tableDiv.firstChild) {
	tableDiv.removeChild(tableDiv.firstChild);
    }
    var div = document.createElement('div');
    div.className = "table-responsive";
    tableDiv.appendChild(div);

    var table = document.createElement('table');
    table.className = 'table table-bordered';
    // Create an empty <thead> element and add it to the table:
    var header = table.createTHead();
    header.innerHTML = '<tr><th class="col-xs-1">Ronda</th>'+
	'<th class="col-xs-1">Extracción</th>'+
	'<th class="col-xs-1">Total Extraido</th>' +
	'<th class="col-xs-1">Extracción otros</th>' +
	'<th class="col-xs-1">Ganancia</th>' +
	'<th class="col-xs-1">Multa</th>' +
	'<th class="col-xs-1">Ganancia Final</th>' +
	"</tr>"

    var tbody = document.createElement('tbody');
    for (var i=0; i < data['rounds'].length; i++){
	var row = tbody.insertRow();
	row.innerHTML = "<td>" + i + "</td>"+
	    "<td>" + data['rounds'][i]['extraction'] + "</td>"+
	    "<td>" + data['rounds'][i]['total extraction'] + "</td>" +
	    "<td>" + data['rounds'][i]['other extraction'] + "</td>" +
	    "<td>" + data['rounds'][i]['gain'] + "</td>" +
	    "<td>" + data['rounds'][i]['penalty'] + "</td>" +
	    "<td>" + data['rounds'][i]['gain_penalty'] +"</td>";
	tbody.appendChild(row);
    }

    table.appendChild(tbody);
    div.appendChild(table);
}

function playerDataPlot(data) {
    var gain = [];
    var extractions = [];
    var total_extractions = [];
    var others_extractions = [];

    for (var i=0; i < data['rounds'].length; i++){
	gain.push(data['rounds'][i]['gain']);
	extractions.push(data['rounds'][i]['extraction']);
	total_extractions.push(data['rounds'][i]['total extraction']);
        others_extractions.push(data['rounds'][i]['other extraction']);	
    }
    
    Highcharts.chart('dataPlot', {
        title: {
            text: 'Jugador numero 0',
        },
        xAxis: {
            title: { 
            	text: 'Número de ronda'
            }
        },
        yAxis: [{//Eje extraccion
            title: {
                text: 'Extracción'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        }, {//Eje Ganancia
            title: {
                text: 'Ganancia',
                style: {
                    color: Highcharts.getOptions().colors[3]
                }
            },
            labels: {
                format: '{value}',
                style: {
                    color: Highcharts.getOptions().colors[3]
                }
            },
            opposite: true
        }],
        // Shared the label when move the mouse
        tooltip: {
            shared: true,
            crosshairs: true,
            headerFormat: '<b>{series.xAxis}</b><br>',
        },
        // legend inside the plot
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 80,
            verticalAlign: 'top',
            y: 55,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        series: [{
            name: 'Extracción',
            yAxis: 0,
	    data: extractions //data: [2, 6, 1]
        }, {
            name: 'Total Extraido',
            yAxis: 0,
            data: total_extractions //[10, 30, 20]
        }, {
            name: 'Otros Extrajeron',
            yAxis: 0,
            data: others_extractions //[8, 24, 19]
        }, {
            name: 'Ganancia',
            yAxis: 1,
            data: gain, //[710, 470, 458],
            tooltip: {
                valueSuffix: ' $'
            },
            marker: {
                lineWidth: 2,
                lineColor: Highcharts.getOptions().colors[3],
            }
        }],
    });
}

function getParameterByName(name, url) {
    /*
      Get the parameters from the url.
      
      This function was take from:
      https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript#answer-901144
      Thanks jolly.exe
     */
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
