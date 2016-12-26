function showKeyInput(){
    document.getElementById('playerKeyInput').className = "form-group";
}

function joinGameRequest(){
    /*
      Login a player in a game
    */
    var game_id = document.getElementById("gameID").value;
    var player_name = document.getElementById("playerName").value;

    var requestJson = {'name': player_name,
		       'game_id': game_id};
    
    $.ajax({
        type: "POST",
        url: url_base + "/api/v1.0/join/" + game_id,
	data: JSON.stringify(requestJson),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(response) {
	    console.log(response);
	    // Hide modal
	    $('#JoinGameModal').modal('hide');
	    // redirect
	    var new_url = '/kuden/juego/?game_id=' + game_id +
		'&player_id=' + response['player id'] +
		'&player_key=' + response['player key'];
	    window.location.href = new_url;
	},
	error: function (xhr) {
	    document.getElementById('joinError').innerHTML = xhr.responseText;
        }
    });
}

function adminJoinRequest(){
    /*
      Login an Admin in a existen game
    */
    // Credentials
    var game_id = document.getElementById("adminId");
    var key = document.getElementById("adminKey");
}
