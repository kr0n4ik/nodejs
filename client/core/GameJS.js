var scene = new THREE.Scene();
var socket = new WebSocket("ws://localhost:9998/");
var game = new GameJS(scene, socket);

socket.onopen = function() {
	console.log("Клиент соеденился с сервером");
	animate();
};
socket.onmessage = function (evt) { 
	game.parse(evt.data);
};
socket.onclose = function() { 
	console.log("Разрыв соеденения");
};

$( document ).ready(function() {
	$("#login").click(function(){
		socket.send('{"code": "AUTH_SESSION", "username": "' + $("#username").val() +  '", "password": "' + $("#password").val() +  '"}');
	});
});

var clock = new THREE.Clock();
var width = window.innerWidth;
var height = window.innerHeight;

var container = document.createElement( 'div' );
document.body.appendChild( container );

var camera = new THREE.PerspectiveCamera( 45, width / height, 1, 40000 );
camera.position.set( 0, 150, 1300 );
scene.add( camera );

var renderer = new THREE.WebGLRenderer( );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( width , height );
container.appendChild(renderer.domElement );
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			
var stats = new Stats();
container.appendChild( stats.dom );

var light = new THREE.DirectionalLight( 0xffffff, 2.25 );
light.position.set( 200, 450, 500 );
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 100;
light.shadow.camera.far = 1200;
light.shadow.camera.left = -1000;
light.shadow.camera.right = 1000;
light.shadow.camera.top = 350;
light.shadow.camera.bottom = -350;
scene.add( light );

var gt = new THREE.TextureLoader().load( "assets/textures/brick_roughness.jpg" );
var gg = new THREE.PlaneBufferGeometry( 16000, 16000 );
var gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );
ground = new THREE.Mesh( gg, gm );
ground.rotation.x = - Math.PI / 2;
ground.material.map.repeat.set( 64, 64 );
ground.material.map.wrapS = THREE.RepeatWrapping;
ground.material.map.wrapT = THREE.RepeatWrapping;
		// note that because the ground does not cast a shadow, .castShadow is left false
ground.receiveShadow = true;
scene.add( ground );
scene.add( new THREE.AmbientLight( 0xffffff ) );
			
var cameraControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
cameraControls.target.set( 0, 10, 0 );
cameraControls.update();

//animate();

function animate() {
	var delta = clock.getDelta();
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	stats.update();
	game.update(delta);
}

function GameJS(scene, socket) {
	this.socket = socket;
	this.scene = scene;
	this.objects = [];
	this.me = null;
	this.keyCode = null;
}

GameJS.prototype.update = function(delta) {
	for(var i in this.objects) {
		this.objects[i].update(delta);
	}
}

GameJS.prototype.parse = function(data) {
	//try {
		var json = JSON.parse(data);
		console.log("Ответ от сервера");
		console.log(json);
		switch (json.code) {
			case "UPDATE_OBJECT": this.update_object(json); break;
		}
	//} catch(e) {
	//	console.log("Ошибка в try/catche" + e);
	//}
}

//Обновляем объекты
GameJS.prototype.update_object = function(json) {
	for(var i in json.items) {
		if (!this.objects[json.items[i].id]) {
			this.objects[json.items[i].id] = new ObjectG(json.items[i]);
			this.scene.add(this.objects[json.items[i].id].root);
		} else {
			this.objects[json.items[i].id].parse(json.items[i]);
		}
	}
}