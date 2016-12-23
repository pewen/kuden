var rules = [];

$(document).ready(function() {    
    // Player infomation
    var game_id = +getParameterByName('game_id');
    var player_id = +getParameterByName('player_id');
    // Query parameter used in connection
    var connect_parameters = 'player_id=' + player_id + '&game_id=' + game_id;

    // Connect to the Socket.IO server.
    var namespace = '/player';
    var socket = io.connect(url_base + namespace,
			    {query:connect_parameters});

    // Event handler for new connections.
    // The callback function is invoked when a connection
    // with the server is established.
    socket.on('connect', function() {
	socket.emit('player_information', {'player_id':player_id,
					   'game_id':game_id});
    });
    
    // Event handler for server sent data.
    // Modal waiting players
    socket.on('connecting_players', function(data) {
	waitingPlayers(data);
	socket.emit('game_information', {'player_id':player_id,
					 'game_id':game_id});
    });
    
    // General infomation of all player.
    socket.on('game_general_information', function(game) {
	gameInformation(game);
	gameBoxPlayers(game);
	gameBoxPersonal(game);
    });

    // Personal player information.
    socket.on('player_information', function(data) {
	// Only show if the player play at less 1 round.
	if (data['rounds'].length > 0){
	    playerDataTable(data);
	    playerDataPlot(data);
	}
    });

    // Explication of the new rule
    socket.on('rules_message', function(new_rule) {
	rules.push(new_rule);
	addRule(new_rule);
	showModalRule(rules.length - 1);
    });

    // Open and close the communication frame
    socket.on('communication', function(data) {
	console.log("entro a la comunicacion");
	openCloseCommunication(data);
    });

    // Summit extraction to the server
    $(document).on("click", "#extractButton", function(){
	var extraction= +document.getElementById('playerExtract').value;
	socket.emit('extract_resources', {'player_id': player_id,
					  'game_id': game_id,
					  'extraction': extraction});
    });
});

function openCloseCommunication(data) {
    var chatFrame = document.getElementById("chatFrame");

    // Open the chat frame
    if (data['open']) {
	console.log("Entro a la comunicacion");
	chatFrame.className = "chat";
	var div = document.createElement('div');
	div.className = "col-md-4";
	div.innerHTML = '<iframe class="embed-responsive-item" src="https://appear.in/your-room-name" width="100%" frameborder="0"></iframe>"';
	chatFrame.appendChild(div);
    }
    // close the chat frame
    else {
	console.log("Termino la comunicion");
	chatFrame.className = "header-hidden";
    }
}

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
	//waitingDiv.appendChild(row);
	$('#waitingPlayersModal').modal('show');
    }
    // If all player are ready, hide the modal
    else {
	$(".waiting-background").remove();
	$('#waitingPlayersModal').modal('hide');
    }
}

function gameInformation(game){
    /*
      Update the number of round and number of player.
     */
    var playersNumber = document.getElementById('playersNumber');
    playersNumber.innerHTML = 'Número de jugadores: ' +
	game['players ready'] +
	'/'  + game['players number'];
    var roundsNumber = document.getElementById('roundsNumber');
    roundsNumber.innerHTML = 'Número de rondas: (' +
	game['round actual'] + '/' + game['rounds number'] + ')';
}

function gameBoxPlayers(game) {
    /*
      Make and update the general information of the others players
    */
    var player_id = +getParameterByName('player_id');
    var playersBoxes = document.getElementById('playersBoxes');
    // Remove all element in the list
    while (playersBoxes.firstChild) {
	playersBoxes.removeChild(playersBoxes.firstChild);
    }

    for (var i = 0; i < game['players info'].length; i++){
	var id = game['players info'][i]['id'];
	// Make the box only if is not my personal box
	if (id != player_id){
	    var div = document.createElement('div');
	
	    if (game['players info'][i]['can play']){
		var can_play = 'Si';
	    } else {
		var can_play = 'No';
	    }
	    if (game['players info'][i]['asigned']  === true) {
		var status = 'color-green';
	    } else {
		var status = 'color-red';
	    }
	
	    div.className = "col-sm-3 col-md-2 box-player " + status;
	    div.innerHTML = '<div class="circle-status"></div> ' +
		'<p>Jugador: ' + id + '<br>' +
		'Puede jugar: ' + can_play + '</p>';
	
	    playersBoxes.appendChild(div);
	}
    }
}

function gameBoxPersonal(game){
    /*
      Make and update my game information
    */
    var player_id = +getParameterByName('player_id');
    var personalBox = document.getElementById('personalBox');
    // Remove all element in the list
    while (personalBox.firstChild) {
	personalBox.removeChild(personalBox.firstChild);
    }

    var div = document.createElement('div');
    
    if (game['players info'][player_id]['can play']){
	var play_button = '<button type="button" class="btn btn-lg btn-primary" id="extractButton">Jugar</button>';
    } else {
	var play_button = '<button type="button" class="btn btn-lg btn-primary" disabled="disabled">Jugar</button>';
    }
    if (game['players info'][player_id]['asigned']){
	var status = 'color-green';
    } else {
	var status = 'color-red';
    }

    div.className = "col-sm-6 col-md-6 box-player " + status;
    div.innerHTML = '<div class="circle-status"></div> ' +
	'<p>Jugador: ' + player_id + '</p>' +
	'<input type="number" min="1" id="playerExtract">' +
	play_button;

    personalBox.appendChild(div);
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

function addRule(rule) {
    /*
      Add a rule
    */
    var rulesDiv = document.getElementById('rules-column');
    var div = document.createElement('div');
    var id = rules.length - 1;
    div.className = "rule-box";
    div.innerHTML = "<h4>" + rule['title'] + "</h4>" +
	'<button type="button" class="btn btn-default" onclick="showModalRule(' + id + ')">Mostrar regla</button>';
    rulesDiv.appendChild(div);
}

function showModalRule(id) {
    BootstrapDialog.show({
        title: rules[id]['title'],
        message: rules[id]['message'],
	buttons: [{
            label: 'Cerrar',
            action: function(dialogItself){
                dialogItself.close();
            }
        }]
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
