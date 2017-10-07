function ObjectG(json) {
	this.root = new THREE.Object3D();
	this.parse(json);
	if (this.model == "capsule")
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
	if (json.id) this.id = json.id;
	if (json.model) this.model = json.model;
	if (json.scale) {
		this.root.scale.x = json.scale;
		this.root.scale.y = json.scale;
		this.root.scale.z = json.scale;
	}
}

//Создаем объект в виде капсулы
ObjectG.prototype.createCapsule = function() {
	this.radius = 12;
	this.height = 20;
	this.half = 20;
	var mesh;
	mesh = new THREE.Mesh( new THREE.CylinderGeometry( this.radius, this.radius, this.height, 32 ), new THREE.MeshNormalMaterial() );
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, this.radius + 6 ), new THREE.MeshNormalMaterial() );
	mesh.position.z = 5;
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.SphereGeometry( this.radius, 32, 32 ), new THREE.MeshNormalMaterial() );
	mesh.position.y = this.height/2;
	this.root.add(mesh);
	mesh = new THREE.Mesh( new THREE.SphereGeometry( this.radius, 32, 32 ), new THREE.MeshNormalMaterial() );
	mesh.position.y = -this.height/2;
	this.root.add(mesh);
}

//Загружаем модель в формате json
ObjectG.prototype.loadJSON = function() {
	var mesh, that = this, loader = new THREE.JSONLoader();
	loader.load( 'assets/models/' + this.model + '.js', function ( geometry, materials ) {
		mesh = new THREE.Mesh( geometry, materials );
		that.root.add(mesh);
	});
}

ObjectG.prototype.update = function(delta) {
	
}