var container;
var camera, scene, renderer;
var controller1, controller2;

var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();

var group;
var loader;
var textureLoader;
var testing = new THREE.Geometry();

init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x808080 );

	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 10 );

	var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
	var material = new THREE.MeshStandardMaterial( {
		color: 0xeeeeee,
		roughness: 1.0,
		metalness: 0.0
	} );
	var floor = new THREE.Mesh( geometry, material );
	floor.rotation.x = - Math.PI / 2;
	floor.receiveShadow = true;
	scene.add( floor );

	scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 6, 0 );
	light.castShadow = true;
	light.shadow.camera.top = 2;
	light.shadow.camera.bottom = - 2;
	light.shadow.camera.right = 2;
	light.shadow.camera.left = - 2;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );

	group = new THREE.Group();
	scene.add( group );

	var geometry = new THREE.BoxBufferGeometry( 0.2, 0.2, 0.2 );
	var hiddenMaterial = new THREE.MeshStandardMaterial( {
		color: Math.random() * 0xffffff,
		roughness: 0.7,
		metalness: 0.0,
		wireframe: true,
		opacity: 0,
		transparent: true
	} );
	var cube = new THREE.Mesh( geometry, hiddenMaterial );
	cube.name = "cube";
	cube.position.x = 0;
	cube.position.y = 0;
	cube.position.z = -5;
	cube.scale.x = 10;
	cube.scale.y = 10;
	cube.scale.z = 10;
	group.add(cube);
	for (var i = 0; i < 3; i++) {
		var material = new THREE.MeshStandardMaterial( {
			color: Math.random() * 0xffffff,
			roughness: 0.7,
			metalness: 0.0
		} );
		var aCube = new THREE.Mesh( geometry, material );
		aCube.position.z = 0;
		aCube.position.y = i;
		aCube.position.x = 0;
		group.add(aCube);
	}

	loader = new THREE.OBJLoader();
	textureLoader = new THREE.TextureLoader();
//for (var i = 0; i < 4; i++) {
	loader.load('./Assets/Head/lee-perry-smith-head-scan.obj', function (object) {
		var colorMap = textureLoader.load('./Assets/Head/Face_Color.jpg');
		var bumpMap = textureLoader.load('./Assets/Head/Face_Disp.jpg');
		var faceMaterial = getMaterial('standard', 'rgb(255, 255, 255)');

		object.traverse(function(child) {
			if (child.name == 'Plane') {
				child.visible = false;
			}
			if (child.name == 'Infinite') {
				child.material = faceMaterial;
				faceMaterial.roughness = 0.875;
				faceMaterial.map = colorMap;
				faceMaterial.roughnessMap = bumpMap;
				faceMaterial.metalness = 0.1;
				faceMaterial.bumpScale = 0.175;
			}
		} );

		object.name = "Face";
		object.scale.x = 0.5;
		object.scale.y = 0.5;
		object.scale.z = 0.5;
		object.position.y = -0.15;
		group.add(object);
		object.parent = cube;
	});

	console.log(group);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.vr.enabled = true;
	container.appendChild( renderer.domElement );

	addControllers(controller1,controller2,scene);

	document.body.appendChild( WEBVR.createButton( renderer ) );
	raycaster = new THREE.Raycaster();
	window.addEventListener( 'resize', onWindowResize, false );
}

function animate() {
	renderer.setAnimationLoop( render );
}

function render() {
	cleanIntersected();
	intersectObjects( controller1 );
	intersectObjects( controller2 );
	renderer.render( scene, camera );
}

function addControllers(){
	controller1 = renderer.vr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
	scene.add( controller1 );

	controller2 = renderer.vr.getController( 1 );
	controller2.addEventListener( 'selectstart', onSelectStart );
	controller2.addEventListener( 'selectend', onSelectEnd );
	scene.add( controller2 );
	addControllerHands();
  addControllerLines();
}

function addControllerHands(){
	var geo = new THREE.CylinderBufferGeometry();
	var mat = new THREE.MeshBasicMaterial();
	var hand = new THREE.Mesh(geo,mat);
	hand.name = 'hand';
	controller1.add(hand.clone());
	controller2.add(hand.clone());
}

function addControllerLines(){
  var geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
  var line = new THREE.Line( geometry );
  line.name = 'line';
  line.scale.z = 5;

  controller1.add( line.clone() );
  controller2.add( line.clone() );
}

function getMaterial(type, color) {
	var selectedMaterial;
	var materialOptions = {
		color: color === undefined ? 'rgb(255, 255, 255)' : color,
	};

	switch (type) {
		case 'basic':
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
		case 'lambert':
			selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
			break;
		case 'phong':
			selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
			break;
		case 'standard':
			selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
			break;
		default:
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
	}

	return selectedMaterial;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onSelectStart( event ) {
	var controller = event.target;
	var intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {
		var intersection = intersections[ 0 ];

		tempMatrix.getInverse( controller.matrixWorld );

		var object = intersection.object;
		object.matrix.premultiply( tempMatrix );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		object.material.emissive.b = 1;
		controller.add( object );

		controller.userData.selected = object;
	}
}

function onSelectEnd( event ) {
	var controller = event.target;

	if ( controller.userData.selected !== undefined ) {
		var object = controller.userData.selected;
		object.matrix.premultiply( controller.matrixWorld );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		object.material.emissive.b = 0;
		group.add( object );

		controller.userData.selected = undefined;
	}
}

function getIntersections( controller ) {

	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( group.children );

}

function intersectObjects( controller ) {

	// Do not highlight when already selected

	if ( controller.userData.selected !== undefined ) return;

	var line = controller.getObjectByName( 'line' );
	var intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {
		var intersection = intersections[ 0 ];

		var object = intersection.object;
		object.material.emissive.r = 1;
		intersected.push( object );

		line.scale.z = intersection.distance;
	} else {
		line.scale.z = 5;
	}
}

function cleanIntersected() {
	while ( intersected.length ) {
		var object = intersected.pop();
		object.material.emissive.r = 0;
	}
}
