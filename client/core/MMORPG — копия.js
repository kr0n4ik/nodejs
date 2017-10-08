var socket = new WebSocket("ws://localhost:9998/");
var scene = new THREE.Scene();
var clock = new THREE.Clock();
var width = window.innerWidth * 0.99;
var height = window.innerHeight * 0.99;
var camera = new THREE.PerspectiveCamera( 30, width / height, 0.1, 2000 );
var objects = [];
var me;


var container = document.createElement( 'div' );
document.body.appendChild( container );
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

scene.add( new THREE.AmbientLight( 0xffffff ) );

animate();

function animate() {
	var delta = clock.getDelta();
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	update(delta);
}

socket.onopen = function() {
	console.log("Клиент соеденился с сервером");
};
socket.onmessage = function (evt) { 
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.code) {
		case "AUTH_RESPONSE": auth_response(json); break;
		case "UPDATE_OBJECT": update_object(json); break;
	}
};
socket.onclose = function() { 
	console.log("Разрыв соеденения");
};

$( document ).ready(function() {
	//$("#login").click(function(){
		socket.send('{"code": "AUTH_SESSION", "username": "tester", "password": "123456"}');
	//});
});

function auth_response(json) {
	me = json.id;
}

function update_object(json) {
	for(var i in json.items) {
		if (!objects[json.items[i]._id] && json.items[i].online && json.items[i].online == 1) {
			objects[json.items[i]._id] = new ObjectG(json.items[i]);
			scene.add(objects[json.items[i]._id].root);
		} 
		if (objects[json.items[i]._id]) {
			objects[json.items[i]._id].parse(json.items[i]);
			if (json.items[i]._id == me && json.items[i].name)
				gui.setName(json.items[i].name);
			if (json.items[i].online && json.items[i].online == 0) {
				scene.remove( objects[json.items[i]._id]);
				delete(objects[json.items[i]._id]);
			}
		}
	}
}

function update(delta) {
	for(var i in objects) {
		objects[i].update(delta, objects);
		if ( i == me ) {
			//camera.rotation.y = this.objects[i].root.rotation.y;
			//camera.lookAt(this.objects[i].root.position);
			camera.position.x = this.objects[i].root.position.x  - 500 * Math.sin(this.objects[i].root.rotation.y);
			camera.position.z = this.objects[i].root.position.z - 500 * Math.cos(this.objects[i].root.rotation.y);
			camera.position.y = this.objects[i].root.position.y + this.objects[i].radius + this.objects[i].height;
			camera.rotation.y = this.objects[i].root.rotation.y - Math.PI;
		}
	}
}

var keyCode;
window.addEventListener( "keydown",
	function(e) {
		if (e.keyCode != keyCode) {
			switch( e.keyCode ) {
				case 87: socket.send('{"code": "MOVE_START_FORWARD"}'); break;
				case 83: socket.send('{"code": "MOVE_START_BACKWARD"}'); break;
				case 65: socket.send('{"code": "MOVE_START_TURN_LEFT"}'); break;
				case 68: socket.send('{"code": "MOVE_START_TURN_RIGHT"}'); break;
				case 32: socket.send('{"code": "MOVE_JUMP"}'); break;
			}
			keyCode = e.keyCode;
		}
	}
);
window.addEventListener( "keyup", 
	function(e) {
		keyCode = 0;
		console.log("key " + e.keyCode);
		switch( e.keyCode ) {
			case 65: socket.send('{"code": "MOVE_STOP_TURN"}'); break;
			case 68: socket.send('{"code": "MOVE_STOP_TURN"}'); break;
			case 87: socket.send('{"code": "MOVE_STOP"}'); break;
			case 83: socket.send('{"code": "MOVE_STOP"}'); break;
		}
	}
);
document.addEventListener( 'mousedown', function(e) { 
	function getSelectObject(objects, raycaster){
		for(var i in objects) {
			if (objects[i].select == 1) {
				for(var j in objects[i].root.children) {
					var intersects = raycaster.intersectObject( objects[i].root.children[j] );
					console.log(intersects);
					if ( intersects.length > 0 ){
						gui.setVictumName(objects[i].name);
						socket.send('{"code": "SET_SELECTION", "id": "' + objects[i].id + '"}');
						return objects[i];
					}
				}
			}
		}
	}
	var vector = new THREE.Vector3(( e.clientX / width ) * 2 - 1, -( e.clientY / height ) * 2 + 1, 0.5);
	vector = vector.unproject(camera);
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	var object = getSelectObject(objects, raycaster);
});

