//Добавляем модули
var clients = [], signs = [], objects = null;
var mmorpg = new MMORPG();
var WebSocketServer = require('ws').Server, socket = new WebSocketServer({port: 9998});
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://kr0n4ik:123456@ds155418.mlab.com:55418/game', function (err, db) {
	if (err) {throw err}
	objects = db.collection('objects');
});


//Запускаем HTTP сервер
app.get('/', function(req, res) {
	res.sendfile('nodejs/index.html');
});
app.use(express.static(__dirname + '/client'));
app.listen(80);

socket.on("connection", function(server, req) {
	var sign = req.headers['sec-websocket-key'];
	signs[sign] = sign;
	clients[sign] = server;
	console.log("Подключился клиент: " + sign);
	server.on("message", function(message) {
		var sign = req.headers['sec-websocket-key'];
		try {
			var json = JSON.parse(message);
			console.log(json);
			switch (json.code) {
				case "AUTH_SESSION": mmorpg.auth_session(sign, json); break;
				
				case "MOVE_START_FORWARD": mmorpg.move_start_forward(sign, json); break;
				//case "MOVE_START_BACKWARD": game.move_start_backward(sign, json); break;
				//case "MOVE_START_TURN_LEFT": game.move_start_turn_left(sign, json); break;
				//case "MOVE_START_TURN_RIGHT": game.move_start_turn_right(sign, json); break;
				//case "MOVE_STOP_TURN": game.move_stop_turn(sign, json); break;
				//case "MOVE_STOP": game.move_stop(sign, json); break;
			}
		} catch(e) {
			console.log("Ошибка в try/catche" + e);
		}
	});
	server.on("close", function close() {
		var sign = req.headers['sec-websocket-key'];
		try {
			var uid = signs[sign];
			delete(signs[sign]);
			delete(clients[uid]);
			console.log("Отключился клиент: " + sign);
		} catch(e) {
			console.log("Ошибка в try/catche" + e);
		}
	})
});
console.log("Сервер игры стартовал");

function MMORPG(){

}

MMORPG.prototype.auth_session = function(sign, json) {
	clients[signs[sign]].send(JSON.stringify({code:"AUTH_RESPONSE", id:"59da2c47734d1d18c95cd930"}));
	objects.find({}).toArray(function(error, list) {
		if (list != null && error == null) {
			clients[signs[sign]].send(JSON.stringify({code:"UPDATE_OBJECT", items: list}));
		}
	});
}

//Находим объект по id и двигаем его в перед
MMORPG.prototype.move_start_forward = function(sign, json) {
	for (var i in clients)
			clients[i].send(JSON.stringify({code:"UPDATE_OBJECT", items:[{_id:"59da2c47734d1d18c95cd930", move: "MOVE_START_FORWARD"}]}));
}