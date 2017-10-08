function ObjectG(json) {
	this.root = new THREE.Object3D();
	this.caster = new THREE.Raycaster();
	this.parse(json);
	if (this.model == "ground")
		this.createGround();
	else if (this.model == "capsule")
		this.createCapsule();
	else
		this.loadJSON();
}
//Парсим данные с сервера
ObjectG.prototype.parse = function(json) {
	if (json.x) this.root.position.x = json.x;
	if (json.y) this.root.position.y = json.y;
	if (json.z) this.root.position.z = json.z;
	if (json.type) this.type = json.type;
	if (json._id) this.id = json._id;
	if (json.select) this.select = json.select;
	if (json.model) this.model = json.model;
	if (json.name) this.name = json.name;
	if (json.scale) {
		this.root.scale.x = json.scale;
		this.root.scale.y = json.scale;
		this.root.scale.z = json.scale;
	}
	if (json.turn) this.turn = json.turn;
	if (json.move) this.move = json.move;
}

//Создаем объект в виде капсулы
ObjectG.prototype.createCapsule = function() {
	this.move = "MOVE_STOP";
	this.turn = "MOVE_STOP_TURN";
	this.WalkSpeed = 150;
	this.BackSpeed = 125;
	this.radius = 12;
	this.height = 20;
	this.half = 10;
	this.TurnRate = 5;
	var mesh;
	mesh = new THREE.Mesh( new THREE.CylinderGeometry( this.radius, this.radius, this.height, 6 ), new THREE.MeshNormalMaterial() );
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, this.radius + 6 ), new THREE.MeshNormalMaterial() );
	mesh.position.z = 5;
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.SphereGeometry( this.radius, 6, 6 ), new THREE.MeshNormalMaterial() );
	mesh.position.y = this.height/2;
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.SphereGeometry( this.radius, 6, 6 ), new THREE.MeshNormalMaterial() );
	mesh.position.y = -this.height/2;
	this.root.add(mesh);
}

//Создаем землю
ObjectG.prototype.createGround = function() {
	var gt = new THREE.TextureLoader().load( "assets/textures/brick_roughness.jpg" );
	var gg = new THREE.PlaneBufferGeometry( 16000, 16000 );
	var gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );
	var ground = new THREE.Mesh( gg, gm );
	ground.rotation.x = - Math.PI / 2;
	ground.material.map.repeat.set( 64, 64 );
	ground.material.map.wrapS = THREE.RepeatWrapping;
	ground.material.map.wrapT = THREE.RepeatWrapping;
	ground.receiveShadow = true;
	this.root.add(ground);
}

//Загружаем модель в формате json
ObjectG.prototype.loadJSON = function() {
	var mesh, that = this, loader = new THREE.JSONLoader();
	loader.load( 'assets/models/' + this.model + '.js', function ( geometry, materials ) {
		mesh = new THREE.Mesh( geometry, materials );
		that.root.add(mesh);
	});
}

ObjectG.prototype.update = function(delta, objects) {
	if (this.type == "character")	{
		var center = this.root.position.clone();
		if (this.turn == "MOVE_START_TURN_LEFT") {
			this.root.rotation.y += this.TurnRate * delta;
		} else if (this.turn == "MOVE_START_TURN_RIGHT") {
			this.root.rotation.y -= this.TurnRate * delta;
		}
		if (this.move == "MOVE_START_FORWARD") {
			center.x += Math.sin(this.root.rotation.y) * this.WalkSpeed * delta;
			center.z += Math.cos(this.root.rotation.y) * this.WalkSpeed * delta;
		} else if (this.move == "MOVE_START_BACKWARD") {
			center.x -= Math.sin(this.root.rotation.y) * this.BackSpeed * delta;
			center.z -= Math.cos(this.root.rotation.y) * this.BackSpeed * delta;
		}
		this.caster.set(center, new THREE.Vector3(0, -1, 0));
		var i, ob, j, mesh, h = -200;
		for(var i in objects) {
			for(var j in objects[i].root.children) {
				var collisions = this.caster.intersectObject(objects[i].root.children[j]);
				if (collisions.length > 0 && collisions[0].point.y > h) {
					h = collisions[0].point.y;
				}
			}
		}
		if (h < center.y - this.height) {
			center.y -= 400 * delta;
		}
		if (h > center.y - this.radius - this.height/2) {
			center.y = h + this.height/2 + this.radius;
		}
		this.root.position.copy( center );
	}
}