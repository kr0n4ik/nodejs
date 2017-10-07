function Player() {
	this.root = new THREE.Object3D();
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

Player.prototype.Parse = function(json) {
	
}