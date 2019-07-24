import * as BG from './modules/background.js';
import * as CLOTH from './modules/cloth.js';
import * as FBO from './modules/fbo.js';
import * as LIGHTS from './modules/lights.js';
import * as MOUSE from './modules/mouse.js';

let
renderer, camera, scene,
mesh, stats, lights,
position;

const
particles = [],
constraints = [],
v0 = new THREE.Vector3();

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

	const ico = new THREE.IcosahedronBufferGeometry( 100, 5 );
	const geometry = THREE.BufferGeometryUtils.mergeVertices( ico, 1.5 );
	position = geometry.attributes.position;

	createParticles( geometry );

	// initialization block;
	BG.init( scene );
	LIGHTS.init( scene );
	CLOTH.init( scene, geometry );

	MOUSE.init( particles, camera );
	FBO.init( renderer, position, particles, MOUSE );

	animate();

}

function createParticles( geometry ) {

	const index = geometry.index;

	for ( let i = 0, il = position.count; i < il; i++ ) {

		v0.fromBufferAttribute( position, i );
		particles.push( new Particle( v0.x, v0.y, v0.z ) );

	}

	for ( let i = 0, il = index.count / 3; i < il; i++ ) {

		const i3 = i * 3;

		const a = index.getX( i3 + 0 );
		const b = index.getX( i3 + 1 );
		const c = index.getX( i3 + 2 );

		particles[ a ].faces.push( [ b, c ] );
		particles[ b ].faces.push( [ c, a ] );
		particles[ c ].faces.push( [ a, b ] );

		if ( ! particles[ b ].adj.includes( a ) ) {

			const dist = particles[ a ].original.distanceTo( particles[ b ].original );

			particles[ a ].adj.push( b );
			particles[ b ].adj.push( a );
			constraints.push( [ a, b, dist * dist ] );

		}

		if ( ! particles[ c ].adj.includes( a ) ) {

			const dist = particles[ a ].original.distanceTo( particles[ c ].original );

			particles[ a ].adj.push( c );
			particles[ c ].adj.push( a );
			constraints.push( [ a, c, dist * dist ] );

		}

		if ( ! particles[ c ].adj.includes( b ) ) {

			const dist = particles[ b ].original.distanceTo( particles[ c ].original );

			particles[ b ].adj.push( c );
			particles[ c ].adj.push( b );
			constraints.push( [ b, c, dist * dist ] );

		}

	}

	for ( let i = 0, il = constraints.length; i < il; i++ ) {

		const con = constraints[i];

		let k = 1;
		while ( true ) {

			while ( particles[ con[0] ].colors[k] !== undefined ) k++;

			if ( particles[ con[1] ].colors[k] === undefined ) {

				con.push( k );
				particles[ con[0] ].colors[k] = con[1];
				particles[ con[1] ].colors[k] = con[0];
				break;

			} else {

				k++;

			}

		}

	}

}

function animate() {

	const t = requestAnimationFrame( animate );

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
