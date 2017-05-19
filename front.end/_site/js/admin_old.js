/*
  Function than can make the admin
*/

function adminGeneralInformation() {
    /*
      Generate the html box data for each player.
    */
    setInterval('adminGeneralInformation()', 1000 * 100);
    
    // Data in the url
    var game_id = getParameterByName('game_id');
    var admin_key = getParameterByName('admin_key');
    // Get the players data
    var game = adminGameInfoRequest(game_id, admin_key);

    // Update number of player, number of round and game id
    var playersNumber = document.getElementById('playersNumber');
    playersNumber.innerHTML = 'Número de jugadores: (' + game['players ready']
	+ '/'  + game['players number'] + ')';
    var roundsNumber = document.getElementById('roundsNumber');
    roundsNumber.innerHTML = 'Número de rondas: (' + game['rounds ready']
	+ '/' + game['rounds number'] + ')';
    var gameNumber = document.getElementById('gameNumber');
    gameNumber.innerHTML = 'Número de juego: ' + game_id +
	', clave: ' + admin_key;
    
    var playersData = document.getElementById('playersData');
    // Remove all element in the list
    while (playersData.firstChild) {
	playersData.removeChild(playersData.firstChild);
    }


    var cnt = 0;
    for (var i = 0; i < game['players'].length; i = i + 2){
	cnt += 2;
	
	// Fisrt, we create the 'row' div
	var rowDiv = document.createElement('div');
	rowDiv.className = 'row';
	playersData.appendChild(rowDiv);

	// Now, we can create the player box data
	if (cnt <= game['players'].length){	    
	    var div = generatePlayerBox(game['players'][i]);
	    rowDiv.appendChild(div);
	    var div = generatePlayerBox(game['players'][i + 1]);
	    rowDiv.appendChild(div);   
	} else {
	    var div = generatePlayerBox(game['players'][i]);
	    rowDiv.appendChild(div);
	}	
    }
    plot();
}


function generatePlayerBox(player) {
    // New player box
    var div = document.createElement('div');
    var id = player['id'];
    if (player['asigned']  === true) {
	var status = 'color-green';
    } else {
	var status = 'color-red';
    }

    div.className = "col-sm-6 col-md-6";
    div.innerHTML = '<div class="box-player ' +  status + '"> ' +
	'<div class="circle-status"></div> ' +
	'<h3>Jugador: ' + id + '</h3>' +
	'<div id="gra1"></div>' +
	'</div>';
    return div
}


function plot() {
    Highcharts.chart('gra1', {
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
            data: [2, 6, 1]
        }, {
            name: 'Total Extraido',
            yAxis: 0,
            data: [10, 30, 20]
        }, {
            name: 'Otros Extrajeron',
            yAxis: 0,
            data: [8, 24, 19]
        }, {
            name: 'Ganancia',
            yAxis: 1,
            data: [710, 470, 458],
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
