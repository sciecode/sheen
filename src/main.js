import * as BG from './modules/background.js';
import * as CLOTH from './modules/cloth.js';
import * as FBO from './modules/fbo.js';
import * as PRE from './modules/pre.js';
import * as LIGHTS from './modules/lights.js';
import * as MOUSE from './modules/mouse.js';

let
renderer, camera, scene;

function init() {

	// renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	renderer.gammaOutput = true;
	renderer.physicallyCorrectLights = true;

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	document.body.appendChild( renderer.domElement );

	// scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x121312 );

	// camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.z = -350;
	camera.position.y = -50;
	camera.position.x = 0;
	camera.lookAt( new THREE.Vector3() );

	// pre-calculate geometry information
	PRE.calculate();

	// initialization block;
	BG.init( scene );
	LIGHTS.init( scene );
	CLOTH.init( scene );

	MOUSE.init( camera );
	FBO.init( renderer );

	// release mem for GC
	PRE.dispose();

	// start program
	animate();

}

function animate() {

	requestAnimationFrame( animate );

	LIGHTS.update();
	FBO.update();

	renderer.setRenderTarget( null );
	renderer.render( scene, camera );

}

window.onresize = function() {

	const w = window.innerWidth;
	const h = window.innerHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

};

init();
