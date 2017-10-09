function GameObject(json) {
	this.mixes = [];
	this.clips = [];
	this.root = new THREE.Object3D();
	this.caster = new THREE.Raycaster();
	this.parse(json);
	if (this.format == "ground")
		this.createGround();
	if (this.format == "json")
		this.loadJSON();
	if (this.format == "mdl")
		this.loadMDL();
}
//Парсим данные с сервера
GameObject.prototype.parse = function(json) {
	if (json.format)
		this.format = json.format;
	if (json.type)
		this.type = json.type;
	if (json.name)
		this.name = json.name;
	if (json.position) {
		this.root.position.x = json.position.x;
		this.root.position.y = json.position.y;
		this.root.position.z = json.position.z;
	}
	if (json.scale) {
		this.root.scale.x = json.scale.x;
		this.root.scale.y = json.scale.y;
		this.root.scale.z = json.scale.z;
	}
	if (json.rotation) {
		this.root.rotation.x = json.rotation.x;
		this.root.rotation.y = json.rotation.y;
		this.root.rotation.z = json.rotation.z;
	}
	if (json.turn)
		this.turn = json.turn;
	if (json.move)
		this.move = json.move;
	this.radius = 2;
	this.height = 5;
	this.half = 1;
	this.TurnRate = 5;
	this.WalkSpeed = 90;
	this.BackSpeed = 70;
	if (json.anim)
		this.anim = json.anim;
	console.log(json);
}

//Создаем объект в виде гладкой поверхности
GameObject.prototype.createGround = function() {
	var gt = new THREE.TextureLoader().load( "assets/textures/brick_roughness.jpg" );
	var gg = new THREE.PlaneBufferGeometry( 16000, 16000 );
	var gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );
	var mesh = new THREE.Mesh( gg, gm );
	mesh.rotation.x = - Math.PI / 2;
	mesh.material.map.repeat.set( 64, 64 );
	mesh.material.map.wrapS = THREE.RepeatWrapping;
	mesh.material.map.wrapT = THREE.RepeatWrapping;
	mesh.receiveShadow = true;
	this.root.add(mesh);
}

GameObject.prototype.createCapsule = function() {
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

//Загружаем модель в формате json
GameObject.prototype.loadJSON = function() {
	var mesh, that = this, loader = new THREE.JSONLoader();
	loader.load( 'assets/models/' + this.name + '.json', function ( geometry, materials ) {
		mesh = new THREE.Mesh( geometry, materials );
		that.root.add(mesh);
	});
}

//Загружаем модель в формате mdl
GameObject.prototype.loadMDL = function() {
	var mesh, that = this;
	THREE.MDLLoader('assets/models/' + that.name + '/' + that.name + '.mdl', function(geometries, anims) {
		geometries.forEach(function(geo) {
				geo.extra.TexturePath = geo.extra.TexturePath ? 'assets/models/' + that.name + '/' + geo.extra.TexturePath.split('\\').pop().replace(/\.\w+$/g, '.png') : ''
		});
		for(var i in geometries) {
			var mat = geometries[i].MaterialCache;
			if (!mat) {
				if (geometries[i].extra.TexturePath) {
					var texture = THREE.ImageUtils.loadTexture(geometries[i].extra.TexturePath, undefined);
					texture.flipY = false
					mat = new THREE.MeshPhongMaterial({ map:texture, alphaTest:0.5, side:geometries[i].extra.TwoSided ? THREE.DoubleSide : THREE.FrontSide })
				} else {
					mat = new THREE.MeshBasicMaterial()
				}
				mat.skinning = true;
				geometries[i].MaterialCache = mat;
			}
			mesh = new THREE.SkinnedMesh(geometries[i], mat);
			that.root.add(mesh);
			that.root.rotation.z = -Math.PI / 2;
			that.root.rotation.x = -Math.PI / 2;
			
			//Тестовая анимация
			for (j = 0; anim = geometries[i].animations[j]; ++j) {
				if (!that.mixes[anim.name]) {
					that.mixes[anim.name] = [];
					console.log(anim.name);
				}
				if (!that.clips[anim.name])
					that.clips[anim.name] = [];
					
				mix = new THREE.AnimationMixer(mesh);
				clip = mix.clipAction(mesh.geometry.animations[j]);
				clip.play();
				that.mixes[anim.name].push(mix);
				that.clips[anim.name].push(clip);
			}
		}
	});
}

GameObject.prototype.update = function(delta, objects) {
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
		var i, ob, j, mesh, h = -800;
		for(var i in objects) {
			if (objects[i].root != this.root) {
				for(var j in objects[i].root.children) {
					var collisions = this.caster.intersectObject(objects[i].root.children[j]);
					if (collisions.length > 0 && collisions[0].point.y > h) {
						h = collisions[0].point.y;
					}
				}
			}
		}
		if (h < center.y - this.height - 30) {
			center.y -= 200 * delta;
		}
		if (h > center.y - this.radius - this.height/2) {
			center.y = h + this.height/2 + this.radius;
		}
		this.root.position.copy( center );
	}

	if (this.anim)
		for(var i in this.mixes[this.anim])
			this.mixes[this.anim][i].update(delta);
}