import os
import datetime
import string
import random
from threading import Thread

from flask import Flask, make_response, jsonify, abort, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import numpy as np

from utils import read4json, save2json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
cors = CORS(app)
socketio = SocketIO(app)

# Path where save all games
games_path = 'games/'

comunication_description = """Antes de tomar su próxima decisión, usted podrá tener una discusión abierta (mediante el chat provisto por el juego), que durará como máximo cinco minutos, con sus compañeros de grupo. Podrá conversar de lo que desee acerca del juego y las reglas, pero ningún jugador podrá hacer alguna promesa o amenaza relacionada con pagos o transferencias de puntos durante o después de terminado el ejercicio. Es simplemente una discusión abierta. El resto de reglas del juego se mantiene. Nosotros le diremos cuando el tiempo haya terminado. Después, usted y sus compañeros deberán suspender la discusión y cada uno tomará su decisión individual para las siguientes rondas. Estas decisiones seguirán siendo privadas y confidenciales como en las otras rondas, y no podrán ser conocidas por el resto de su grupo o por otras personas."""

high_regulation_description = """Esta nueva regla sirve para obtener el máximo de puntos posibles para el grupo. Vamos a tratar de garantizar que cada jugador escoja un nivel de extracción de uno. Si un jugador escoge más de una unidad, se le aplicará una multa de 175 puntos por cada unidad adicional extraída.<br>
Sin embargo, como es muy difícil inspeccionar los resultados de todos los miembros del grupo, seleccionaremos al azar a uno de los integrantes. Sólo quien salga seleccionado se le aplicará la multa, si es el caso."""

low_regulation_description = """Esta nueva regla sirve para obtener el máximo de puntos posibles para el grupo. Vamos a tratar de garantizar que cada jugador escoja un nivel de extracción de uno. Si un jugador escoge más de una unidad, se le aplicará una multa de 50 puntos por cada unidad adicional extraída.<br>
Sin embargo, como es muy difícil inspeccionar los resultados de todos los miembros del grupo, seleccionaremos al azar a uno de los integrantes. Sólo quien salga seleccionado se le aplicará la multa, si es el caso."""


def key_generator(size=6, chars=string.ascii_uppercase + string.digits):
    """
    Generate a random key of 6 digits by default.
    """
    return ''.join(random.choice(chars) for _ in range(size))


def check_game_id(game_id):
    """
    Check if a game id exist. If not, return 400 error.

    Parameter
    ---------
    game_id: int
      Unique game id.

    Error
    -----
    400: Game id not exist
    """
    files = [i for i in os.listdir(games_path)
             if i.startswith('gameId_')]
    file_name = "gameId_{}.json".format(game_id)

    # Game id not exist
    if file_name not in files:
        abort(400, 'Game id not exist')


def check_admin_key(game_id, key):
    """
    Check if the admin key is correct.

    Parameters
    ----------
    key: str
      Unique key use to authenticating.
    game_id: int
      Unique game id.

    Error
    -----
    401: Invalid key.
    """
    file_name = "gameId_{}.json".format(game_id)
    game_file = read4json('games/' + file_name)

    if key != game_file["admin key"]:
        abort(401, 'Invalid admin key')


def check_player_key(game_id, player_id, key):
    """
    Check if the player key is correct.

    Parameters
    ----------
    pleyer_id: int
      Unique player id
    key: str
      Unique key use to authenticating.
    game_id: int
      Unique game id.

    Error
    -----
    401: Invalid key.
    """
    file_name = "gameId_{}.json".format(game_id)
    game_file = read4json('games/' + file_name)

    if key != game_file["players"][player_id]['key']:
        abort(401, 'Invalid player key')


"""
Public Methods
--------------
"""


@app.route("/hola")
def hola():
    data = {'data': 'Hola mundo desde Kuden'}
    return jsonify(data)


@app.route("/api/v1.0/new_game", methods=['POST'])
def new_game():
    """
    Create a new game with a unique game id. Generate the admin
    credential.

    Parameters JSON
    ---------------
    name: str
      Game name.
    players number: int
      Number of players.
    rounds number: int
      Number of rounds.
    parameters: list
      [a, b, alpha, e] use to calculate the gain function.
    rules: list
      List with the rules used in the game.
    bots: list
      List with the bots used in the game.

    Request body
    ------------
    game id: int
      Unique game id.
    admin key: str
      Unique admin key used for authenticating.

    TODO
    ----
    * Con los parametros, calcular la funcion de ganancia para cada juego.
    * Inicializar los bots en el listado de jugadores.
    """
    content = request.json

    # Create a unique game id
    # Busco todos los archivos que empizen con game_
    files = [i for i in os.listdir(games_path)
             if i.startswith('gameId_')]

    if not files:
        # no existen juegos anteriores
        game_id = 1
    else:
        max_num = 0
        for file_name in files:
            ext, text = file_name.split('_', maxsplit=1)
            num, ext = text.split('.')
            num = int(num)
            if num > max_num:
                max_num = num

        game_id = max_num + 1

    # Create the game
    key = key_generator()
    game = {'game id': game_id,
            'date': str(datetime.datetime.now()),
            'end': False,
            'players number': content['players number'],
            'players ready': 0,
            'rounds number': content['rounds number'],
            'round actual': 1,
            'state': 'waiting players(0/{0})'.format(content['players number']),
            'admin key': key,
            'parameters': content['parameters'],
            'rules': content['rules'],
            'players': [
                {'asigned': False,
                 'key': key_generator(),
                 'id': i,
                 'can play': False,
                 'rounds': []}
                for i in range(content['players number'])]}

    # Save the game
    file_name = "{}gameId_{}.json".format(games_path, game_id)
    save2json(file_name, game)

    out = {'game id': game_id,
           'admin key': key}
    return jsonify(out), 201


@app.route("/api/v1.0/join/<int:game_id>", methods=['POST'])
def new_player(game_id):
    """
    Create new player in a existen game. Generate the player credential.

    Parameter
    ---------
    game_id: int
      Unique game id.

    Request body
    ------------
    player id: int
      Unique player id randomly assigned.
    player key: str
      Unique player key used for authenticating.

    Error
    -----
    400: Game id not exist.
    400: All players was assigned.
    """
    check_game_id(game_id)

    # Read game
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    # Read all unasigned players numbers
    asigned = [x['asigned'] for x in game['players']]
    numbers = [num for num, val in enumerate(asigned) if not val]

    # All players were assigned
    if not numbers:
        abort(400, 'All players was assigned.')

    # Choice a random number of player
    player_id = int(random.choice(numbers))
    game['players'][player_id]['asigned'] = True

    # Update the game state
    ready_players = game["players number"] - (len(numbers) - 1)
    if ready_players > 0:
        text = "waiting players ({0}/{1})".format(ready_players,
                                                  game["players number"])
        game['state'] = text
    else:
        game['state'] = "play"

    game['players ready'] = ready_players

    # Check if all players are asigned.
    # If true, 'can play' of each play is put true
    ready = all([player['asigned'] for player in game['players']])
    if ready:
        for player in game['players']:
            player['can play'] = True

    # Save the game file
    file_name = "{}gameId_{}.json".format(games_path, game_id)
    save2json(file_name, game)

    out = {'player id': player_id,
           'player key': game['players'][player_id]['key']}
    return jsonify(out)


@app.route("/api/v1.0/statistics/", methods=['GET'])
def basic_stadistics():
    """
    Basic information of all games (finished, play and starting games).

    Request body
    ------------
    out = [{game_id: int
           date: str
           number_player: int
           number_rounds: int
           state: "starting or plaing or finished"},
           {}, ... {}]
    """
    pass


@app.route("/api/v1.0/statistics/<int:game_id>", methods=['GET'])
def complete_stadistics():
    """
    All the information about a game only if the game is finished.

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
    """
    pass


"""
Admin methods
-------------
"""


@app.route("/api/v1.0/admin/<int:game_id>/<admin_key>/player/<int:player_id>",
           methods=['DELETE'])
def delet_player(game_id, admin_key, player_id):
    """
    Delet an existent players.

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
    400: Player id not exist.
    401: Admin key invalid.
    """
    check_game_id(game_id)
    check_admin_key(game_id, admin_key)

    # Read game file
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    # Check if the player id exist
    if len(game['players']) < player_id:
        abort(400, 'Player id not exist')

    # Delet player and generate a new key for this payer
    game['players'][player_id]['asigned'] = False
    game['players'][player_id]['key'] = key_generator()

    # Save the game file
    file_name = "{}gameId_{}.json".format(games_path, game_id)
    save2json(file_name, game)

    # Read all unasigned players numbers
    asigned = [x['asigned'] for x in game['players']]
    numbers = [num for num, val in enumerate(asigned) if not val]

    out = {'messag': 'player deleted',
           'player ready': game['players num'] - len(numbers),
           'missing players': len(numbers)}
    return jsonify(out)


@app.route("/api/v1.0/admin/<int:game_id>/<admin_key>/game",
           methods=['GET'])
def game_info(message):
    """
    All the information about the game.

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
    """
    check_game_id(message['game_id'])
    check_admin_key(message['game_id'], message['admin_key'])

    # Read game file
    file_name = "gameId_{}.json".format(message['game_id'])
    game = read4json('games/' + file_name)

    return jsonify(game)


"""
Player Methods
--------------
"""


@socketio.on('connect', namespace='/player')
def player_connection():
    """
    Connect the player to the server via webSocket.
    Join the player in a room[game_id].

    Query Parameters
    ----------------
    game_id: int
      Unique game id.
    player_id: int
      Unique player id.

    Event return name
    -----------------
    connecting_players

    Return
    ------
    players_ready: list
      List with True or False of all players if the player is ready.
    start_game: bool
      If all players are ready, is True. Else, False.

    TODO
    ----
    * No estoy controlando el player_id ni el game_id
    """
    player_id = int(request.args.get('player_id'))
    game_id = int(request.args.get('game_id'))
    # The room name is the unique game id
    join_room(game_id)
    join_room(str(game_id) + '-' + str(player_id))

    # Read game file
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    ready = [player['asigned'] for player in game['players']]
    can_start = all([player['asigned'] for player in game['players']])
    out = {'players_ready': ready,
           'start_game': can_start}

    emit('connecting_players', out, room=game_id)


@socketio.on('disconnect', namespace='/player')
def player_disconnect():
    """
    Close the webSocket connection.

    TODO
    ----
    * Si se desconectaron todos, borrar la sala.
    """
    print('Client disconnected')


@socketio.on('player_information', namespace='/player')
def player_information(data):
    """
    Send player information
    """
    game_id = data['game_id']
    player_id = data['player_id']

    # Read game
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    info = game['players'][player_id]
    emit('player_information', info)


@socketio.on('game_information', namespace='/player')
def game_information(data):
    game_id = data['game_id']

    # Read game
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    # General info to return
    general_info = {'players number': game['players number'],
                    'players ready': game['players ready'],
                    'rounds number': game['rounds number'],
                    'round actual': game['round actual'],
                    'game id': game['game id'],
                    'date': game['date'],
                    'state': game['state'],
                    'players info': [{'id': player['id'],
                                      'asigned': player['asigned'],
                                      'can play': player['can play']}
                                     for player in game['players']]}
    emit('game_general_information', general_info)


@socketio.on('extract_resources', namespace='/player')
def extract_resources(data):
    """
    Make a resource extraction.

    Parameter
    ---------
    game_id: int
      Unique game id.
    player_id: int
      Unique player id.
    extraction: int
      Number of extracted resources.

    Event return name
    -----------------
    game_general_infomation

    Return
    ------


    TODO
    ------
    Error: Is not your turn to play.
    Error: Is not all player ready to play.
    """
    """
    # Check if all players are ready to play
    ready = all([player['asigned'] for player in game['players']])
    if not ready:
        return jsonify({'error': "Missing players to start the game."})

    # Check if is the player turn to play
    if not game['players'][player_id]['can play']:
        return jsonify({'error': 'Is not your turn to play'})
    """
    game_id = data['game_id']
    player_id = data['player_id']

    # Read game
    file_name = "gameId_{}.json".format(game_id)
    game = read4json('games/' + file_name)

    # Save player extraction
    extraction = {'extraction': data['extraction'],
                  'total extraction': -1,
                  'other extraction': -1,
                  'penalty': 0,
                  'gain': -1,
                  'gain_penalty': -1}
    game['players'][player_id]['rounds'].append(extraction)
    game['players'][player_id]['can play'] = False

    # Check if round finished
    can_play = [player['can play'] for player in game['players']]
    round_end = True not in can_play
    if round_end:
        calculate_gain(game)
        send_rules_message(game)

    # Save the game file
    file_name = "{}gameId_{}.json".format(games_path, game_id)
    save2json(file_name, game)

    # General info to return
    general_info = {'players number': game['players number'],
                    'players ready': game['players ready'],
                    'rounds number': game['rounds number'],
                    'round actual': game['round actual'],
                    'game id': game['game id'],
                    'date': game['date'],
                    'state': game['state'],
                    'players info': [{'id': player['id'],
                                      'asigned': player['asigned'],
                                      'can play': player['can play']}
                                     for player in game['players']]}

    emit('game_general_information', general_info, room=game_id)


def calculate_gain(game):
    """
    When the round finished, calculate the gain, and 1 to
    'rounds ready' and change the value of 'can play' to all players.

    TODO
    ----
    * chequear si se tiene que aplicar RA o RB y aplicar la sancion
    """
    game['round actual'] += 1

    for player in game['players']:
        player['can play'] = True

    # Calculate the gain of each player
    parameters = game['parameters']
    for i in range(game['players number']):
        total_extractions = [player['rounds'][-1]['extraction']
                             for player in game['players']]
        player_extraction = total_extractions[i]

        extractions = np.array(total_extractions)
        gain = (parameters[0]*player_extraction -
                0.5*parameters[1]*player_extraction**2) +\
            parameters[2]*sum(parameters[3] - extractions)

        game['players'][i]['rounds'][-1]['gain'] = gain
        sum_extraxtion = sum(total_extractions)
        game['players'][i]['rounds'][-1]['total extraction'] = sum_extraxtion
        other_extraction = sum(total_extractions) - player_extraction
        game['players'][i]['rounds'][-1]['other extraction'] = other_extraction

    # Aply high regulation
    if 'high regulation' in game['rules']:
        rule = game['rules']['high regulation']
        actual_round = game['round actual']
        if actual_round == rule['round']:
            # calculate the penalty
            penaltys = np.zeros(game['players number'])
            player = np.random.randint(low=0, high=game['players number'] + 1)
            penaltys[player] = rule['penalty']

            # aply the penalty
            for player, penalty in zip(game['players'], penaltys):
                player['rounds'][-1]['penalty'] = penalty
                player['rounds'][-1]['gain_penalty'] = player['rounds'][-1]['gain'] - penalty

    # Aply low regulation
    if 'low regulation' in game['rules']:
        rule = game['rules']['low regulation']
        actual_round = game['round actual']
        if actual_round == rule['round']:
            # calculate the penalty
            penaltys = np.zeros(game['players number'])
            player = np.random.randint(low=0, high=game['players number'] + 1)
            penaltys[player] = rule['penalty']

            # aply the penalty
            for player, penalty in zip(game['players'], penaltys):
                player['rounds'][-1]['penalty'] = penalty
                player['rounds'][-1]['gain_penalty'] = player['rounds'][-1]['gain'] - penalty

    thread = Thread(target=send_personal_info(game))
    thread.start()


def send_personal_info(game):
    """
    Send to the client, the player personal data update.
    """
    for player_id in range(game['players number']):
        info = game['players'][player_id]
        room = str(game['game id']) + '-' + str(player_id)

        emit('player_information', info, room=room)


def send_rules_message(game):
    """
    Send message to clients if in this round start a new rule

    TODO:
    * si llego a tener dos reglas en el mismo turno, solo voy a
    mandar la ultima regla.
    """
    out = False

    if 'comunicaction' in game['rules']:
        rule = game['rules']['comunication']
        if game['round actual'] == rule['round']:
            out = {'title': 'Regla de Comunicación',
                   'message': comunication_description,
                   'round activate': rule['round']}

    if 'high regulation' in game['rules']:
        rule = game['rules']['high regulation']
        if game['round actual'] == rule['round']:
            out = {'title': 'Regla de Regulación Alta',
                   'message': high_regulation_description,
                   'round activate': rule['round']}

    if 'low regulation' in game['rules']:
        rule = game['rules']['low regulation']
        if game['round actual'] == rule['round']:
            out = {'title': 'Regla de Regulación Baja',
                   'message': low_regulation_description,
                   'round activate': rule['round']}

    if out:
        emit('rules_message', out, room=game['game id'])


"""
Http Errors
-----------
"""


@app.errorhandler(400)
def bad_request(error):
    """
    Error 400 for Bad Request.
    The body request is empy or with a bad key
    For example `new_name` in side of `name`.
    """
    if error.description:
        message = error.description
    else:
        message = 'Not found'
    return make_response(jsonify({'error': message}), 400)


@app.errorhandler(401)
def unauthorized(error):
    """
    Error 401 for Unauthorized.
    """
    if error.description:
        message = error.description
    else:
        message = 'Unauthorized'

    return make_response(jsonify({'error': message}), 401)


@app.errorhandler(404)
def not_found(error):
    """
    Error 404 for Resource Not Found.
    The id in the URI don't exist.
    """
    if error.description:
        message = error.description
    else:
        message = 'Not found'

    return make_response(jsonify({'error': message}), 404)


if __name__ == "__main__":
    socketio.run(app, debug=True)