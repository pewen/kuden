# RUC API

Descripción de la API.

Los métodos del servidor pueden ser:
* Públicos: No hace falta ninguna credencial. Funcionan bajo https.
  La ruta es `/api/v1.0/<nombre_metodo>`.

* Jugadores: Hace falta una credencial de jugador valida para ese juego especifico. Esta se crea al inicializar una partida como jugador.
  Funciona bajo webSocket.

* Administrador: Hace falta la credencial de administrador valida para ese juego especifico. Esta se crea al inicializar una nueva partida.
  Funciona bajo webSocket.


## Public Methods

* `new_game()`

Create a new game with a unique game id. Generate the admin credential.

	POST   /api/v1.0/new_game/<int:players>/<int:rounds>

	Parameters
    ----------
    players: int
		Number of players.
    rounds: int
		Number of rounds.

    Request body
    ------------
    game_id: int
		Unique game id.
	admin_key: str
		Unique admin key used for authenticating.


* `new_player()`

Create a new player in a existen game. Generate the player credential.

	POST   /api/v1.0/<int:game_id>/new_player

	Parameter
    ---------
    game_id: int
		Unique game id.
	
    Request body
    ------------
    player_id: int
		Unique player id randomly assigned.
	player_key: str
		Unique player key used for authenticating.
	
	Error
	-----
	400: Game id not exist.
	400: All players was assigned


* `basic_stadistics()`

Basic information of all games (finished, plaing and starting games)

	GET    /api/v1.0/stadistics/

	Request body
	------------
	out = [{game_id: int
		    date: str
		    number_player: int
	        number_rounds: int
		    state: "starting or plaing or finished"},
			{}, ... {}]


* `complete_stadistics()`

All the information about a game only if the game is finished.

	GET    /api/v1.0/stadistics/<int:game_id>

	Request Body
	------------
	game_id: int
	date: str
	number_player: int
	number_rounds: int
	state: "finished"
	players: [{ }, {}]

	Error
	-----
	400: The game is not finished


## Admin Methods

* `delet_player()`

Delet an existent players.

	DELETE /api/v1.0/admin/<int:game_id>/<admin_key>/player/<int:player_id>
	
	Parameters
    ----------
    game_id: int
		Unique game id.
	admin_key : str
		Unique admin key.
    player_id: int
		Unique player id.

    Request body
    ------------
	message: str
	  Ok

	Errors
	------
	400: Game id not exist.
	401: Admin key invalid.
	400: Player id not exist.


* `game_info()`

All the information about the game.

	GET /api/v1.0/admin/<int:game_id>/<admin_key>/game

	Parameters
    ----------
    game_id: int
		Unique game id.
	admin_key : str
		Unique admin key.

	Request body
	------------
	game: JSON
		JSON with all the informaton about the game.

	Errors
	------
	400: Game id not exist.
	401: Admin key invalid.


## Players Methods

* `player_game_info()`

Basic information about the game.

	GET    /api/v1.0/player/<int:game_id>/<int:player_id>/<player_key>/game

	Parameters
	----------
	game_id: int
		Unique game id.
	player_key : str
		Unique player key.

	Request body
	------------


	Errors
	------
	400: Game id not exist.
	401: Player key invalid.


* `extraction()`

Make a resource extraction.

	POST   /api/v1.0/player/<int:game_id>/<int:player_id>/<player_key>/play/<int:extraction>

	Parameter
    ---------
    game_id: int
      Unique game id.
    player_key: str
      Unique player key.
    extraction: int
      Number of extracted resources.

	Request body
	------------


	Errors
	------
	Error: Missing players to start the game.
	Error: Is not your turn to play.
	400: Game id not exist.
	401: Player key invalid.


