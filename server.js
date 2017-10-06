//Добавляем модули
var WebSocketServer = require('ws').Server, Server = new WebSocketServer({port: 9998});
var express = require('express');
var app = express();

//Запускаем HTTP сервер
app.get('/', function(req, res) {
	res.sendfile('nodejs/index.html');
});
app.listen(80);

console.log("Сервер игры стартовал");
