//Добавляем модули
var WebSocketServer = require('ws').Server, socket = new WebSocketServer({port: 9998});
var express = require('express');
var app = express();
var clients = [], signs = [];

//Запускаем HTTP сервер и перечесляем файлы, к которым есть допуск
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
			console.log("Ответ от клиента");
			console.log(json);
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
