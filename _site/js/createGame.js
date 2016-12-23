function addCooperativeBot(i){
    /*
      Agrega un nuevo bot cooperativo
    */
    var cooperativeDiv = document.getElementById("cooperativeDiv");
    var div = document.createElement('div');
    div.innerHTML = '<div class="row input-line">' +
	'<div class="col-xs-3 col-sm-3">' +
	'<label for="cooperative'+ (i+1) +'">Cooperativo:</label></div>' +
	'<div class="col-xs-1 col-sm-1">' +
	'<input type="checkbox" checked id="cooperative'+ (i+1) +'">' +
	'</div><!--/col-sm-1 -->' +
	'<div class="col-xs-2 col-sm-2">' +
	'<label for="cooperativeUmbral'+ (i+1) +'">Umbral:</label>'+
	'</div>'+
	'<div class="col-xs-2 col-sm-2">'+
	'<input type="number" min="0" class="form-control" id="cooperativeUmbral'+ (i+1) +'">'+
	'</div>'+
	'<div class="col-xs-1 col-sm-1">'+
	'<button type="button" class="btn btn-primary"  onclick="addCooperativeBot('+ (i+1) +')">'+
	'<i class="fa fa-plus" aria-hidden="true"></i></button></div></div><!--/row -->';
    cooperativeDiv.appendChild(div);

    var button = document.getElementById('createGameButton');
    button.setAttribute('onclick','newGameRequest('+(i+1)+')');
}

function newGameRequest(coop_total){
    /*
      Creaun nuevo juego

      TODO:
      * Falta chequear que todos las entradas sean correctas
      */
    // Basic configuraion
    var players_number = +document.getElementById("playersNumber").value;
    var rounds_number = +document.getElementById("roundsNumber").value;
    var game_name = document.getElementById("gameName").value;
    // Parameters
    var param_a = +document.getElementById("parameterA").value;
    var param_b = +document.getElementById("parameterB").value;
    var param_alpha = +document.getElementById("parameterAlfa").value;
    var param_e = +document.getElementById("parameterE").value;
    var param = [param_a, param_b, param_alpha, param_e];

    // RULES
    var rules = {};
    // Comunication rule
    var com_state = document.getElementById('comRule').checked;
    if (com_state){
	var round = +document.getElementById("comRuleRound").value;
	var time = +document.getElementById("comRuleTime").value;
	rules['comunication'] = {'round':round, 'time': time};
    }
    // RA rule
    var ra_state = document.getElementById('raRule').checked;
    if (ra_state){
	var round = +document.getElementById("raRuleRound").value;
	var penalty = +document.getElementById("raRulePenalty").value;
	rules['high regulation'] = {'round':round, 'penalty':penalty};
    }
    // RB rule
    var rb_state = document.getElementById('rbRule').checked;
    if (rb_state){
	var round = +document.getElementById("rbRuleRound").value;
	var penalty = +document.getElementById("rbRulePenalty").value;
	rules['low regulation'] = {'round':round, 'penalty':penalty};
    }
    // Show rounds rule
    var show_round = document.getElementById('srRule').checked;
    if (show_round){
	rules.push({'type':'show rounds'});
    }

    // BOTS
    var bots = [];
    // Free runner Bot
    var free_runner = document.getElementById('freeRunner').checked;
    if (free_runner){
	var number = +document.getElementById("freeRunnerNumber").value;
	bots.push({'type':'free runner', 'number': number});
    }
    // Altruista Bot
    var altruista = document.getElementById('altruista').checked;
    if (altruista){
	var number = +document.getElementById("altruistaNumber").value;
	bots.push({'type':'altruista', 'number':number});
    }
    // Cooperativo Bot
    number = 0
    threshold = [];
    for (i = 1; i <= coop_total; i++){
	state = document.getElementById('cooperative'+i).checked;
	if (state){
	    number++;
	    var value = +document.getElementById('cooperativeUmbral'+i).value;
	    threshold.push(value);
	}
    }
    if (number > 0){
	bots.push({'type':'cooperative', 'numer':number, 'threshold':threshold});
    }

    var requestJson = {'name': game_name,
		       'players number': players_number,
		       'rounds number': rounds_number,
		       'parameters': param,
		       'rules': rules,
		       'bots': bots};
    // Make the post to the server
    $.ajax({
        type: "POST",
        url: url_base + "/api/v1.0/new_game",
	data: JSON.stringify(requestJson),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(response){
	    // Hide modal
	    $('#CreateGameModal').modal('hide');
	    // redirect
	    var new_url = '/juego/admin/?game_id=' + response['game id'] +
		'&admin_key=' + response['admin key'];
	    window.location.href = new_url;
	},
	error: function(xhr){
            alert(xhr.responseText);
        }
    });
}
