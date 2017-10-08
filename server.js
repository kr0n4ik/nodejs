//Добавляем модули
var clients = [], signs = [], objects = null;
var game = new GameJS();
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
				case "AUTH_SESSION": game.auth_session(sign, json); break;
				case "MOVE_START_FORWARD": game.move_start_forward(sign, json); break;
				case "MOVE_START_BACKWARD": game.move_start_backward(sign, json); break;
				case "MOVE_START_TURN_LEFT": game.move_start_turn_left(sign, json); break;
				case "MOVE_START_TURN_RIGHT": game.move_start_turn_right(sign, json); break;
				case "MOVE_STOP_TURN": game.move_stop_turn(sign, json); break;
				case "MOVE_STOP": game.move_stop(sign, json); break;
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

function GameJS(){

}

//Находим объект по id и двигаем его в перед
GameJS.prototype.move_start_forward = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], move: "MOVE_START_FORWARD"}]}, "all");
}

//Находим объект по id и двигаем его в назад
GameJS.prototype.move_start_backward = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], move: "MOVE_START_BACKWARD"}]}, "all");
}

//Находим объект по id и останавливаем
GameJS.prototype.move_stop = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], move: "MOVE_STOP"}]}, "all");
}

//Находим объект по id и поворачиваем в лево
GameJS.prototype.move_start_turn_left = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], turn: "MOVE_START_TURN_LEFT"}]}, "all");
}

//Находим объект по id и поворачиваем в право
GameJS.prototype.move_start_turn_right = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], turn: "MOVE_START_TURN_RIGHT"}]}, "all");
}

//Находим объект по id и останавливаем его
GameJS.prototype.move_stop_turn = function(sign, json) {
	this.send(sign, {code:"UPDATE_OBJECT", items:[{_id:signs[sign], turn: "MOVE_STOP_TURN"}]}, "all");
}

GameJS.prototype.send = function(sign, data, type) {
	if (type == "all") {
		for (var i in clients)
			clients[i].send(JSON.stringify(data));
	} else if (type == "me") {
		clients[signs[sign]].send(JSON.stringify(data));
	} else {
		for (var i in clients)
			if (i != signs[sign])
				clients[i].send(JSON.stringify(data));
	}
}

GameJS.prototype.auth_session = function(sign, json) {
	var name = json.username.replace(/[^0-9a-zA-Zа-яА-Я\s]/g, '').substring(0, 15);
	var password = json.password;
	var that = this;
	objects.findOne({name:name}, function(error, item) {
		if (item != null && error == null && signs[sign] == sign) {
			signs[sign] = item._id;
			clients[item._id] = clients[sign];
			delete(clients[sign]);
			that.send(sign, {code:"AUTH_RESPONSE", id:item._id}, "me");
			objects.find({}).toArray(function(error, list) {
				if (list != null && error == null) {
					var a = {};
					a['code'] = 'UPDATE_OBJECT';
					a['items'] = list;
					that.send(sign, a, "me");
				}
			});
		} else {
			clients[signs[sign]].send(JSON.stringify({"code":"ALERT", "text": "Неверный логин или пароль"}));
		}
	});
}