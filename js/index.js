import * as FBO from './fbo.js';

var steps = 12;
var stiffness = 0.76;
var mass = 0.12;
var cutoff = 0.88;
var DRAG = 0.91;
var PULL = 28.5;
var TIMESTEP = 16 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

let renderer, camera, scene,
controls, mesh, stats,
position, interacting = false,
psel = undefined;

const particles = [],
constraints = [],

v0 = new THREE.Vector3(),
mouse = new THREE.Vector2(),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
normal = new THREE.Vector3(),
raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -180 );

init();

function init() {

	// core

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	renderer.gammaOutput = true;
	renderer.physicallyCorrectLights = true;

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	renderer.setClearColor( 0x0f1519 );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.z = -350;
	camera.position.y = -50;
	camera.position.x = 0;

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enablePan = false;

	stats = new Stats();
	document.body.appendChild( stats.dom );

	// lights
	const light = new THREE.AmbientLight( 0xeeffe6, 0.9 );
	scene.add( light );

	const spotLight = new THREE.SpotLight( 0xfd8b8b, 2.6, 4000, Math.PI/6, 0.2, 0.11 );
	spotLight.position.set( 0.9, 0.1, -0.5 ).multiplyScalar( 400 );
	spotLight.castShadow = true;
	spotLight.shadow.radius = 5;
	spotLight.shadow.camera.far = 4000
	spotLight.shadow.mapSize.height = 4096;
	spotLight.shadow.mapSize.width = 4096;
	scene.add( spotLight );

	const spotLight2 = new THREE.SpotLight( 0x6b7af4, 2.6, 4000, Math.PI/6, 0.2, 0.11 );
	spotLight2.position.set( -0.91, 0.1, -0.5 ).multiplyScalar( 400 );
	spotLight2.castShadow = true;
	spotLight2.shadow.radius = 5;
	spotLight2.shadow.camera.far = 4000;
	spotLight2.shadow.mapSize.height = 4096;
	spotLight2.shadow.mapSize.width = 4096;
	scene.add( spotLight2 );

	const directionalLight3 = new THREE.DirectionalLight( 0xffffff, 0.6 );
	directionalLight3.position.set( 0, 1, -0.2 );
	scene.add( directionalLight3 )

	const spotLight3 = new THREE.SpotLight( 0xffffff, 1.0, 4000, Math.PI/3, 1.4, 0.08 );
	spotLight3.position.set( 0, 0, -1 ).multiplyScalar( 400 );
	spotLight3.castShadow = true;
	spotLight3.shadow.radius = 5;
	spotLight3.shadow.camera.far = 4000;
	spotLight3.shadow.mapSize.height = 4096;
	spotLight3.shadow.mapSize.width = 4096;
	scene.add( spotLight3 );

	const bgMaterial = new THREE.MeshPhysicalMaterial( {

		color: 0xc9c9c9,
		metalness: 0.9,
		roughness: 0.4

	} );

	const bgGeometry = new THREE.PlaneBufferGeometry( 8000, 8000 );

	const bg = new THREE.Mesh( bgGeometry, bgMaterial );
	scene.add( bg );
	bg.receiveShadow = true;
	bg.rotation.x += Math.PI * 0.9;
	bg.position.set( 0, -100, 2000 );

	// mesh

	const material = new THREE.MeshPhysicalMaterial( {
		color: 0xffda20,
		metalness: 0.1,
		roughness: 0.5,
		clearCoat: 0.8,
		clearCoatRoughness: 0.3
	} );

	const ico = new THREE.IcosahedronBufferGeometry( 100, 5 );
	const geometry = THREE.BufferGeometryUtils.mergeVertices( ico, 1.5 );

	mesh = new THREE.Mesh( geometry, material );
	mesh.castShadow = true;
	scene.add( mesh );

	// particles

	position = geometry.attributes.position;
	createParticles( geometry );

	FBO.init( renderer, position );

	animate();

}

function createParticles( geometry ) {

	const index = geometry.index;

	for ( let i = 0, il = position.count; i < il; i++ ) {

		v0.fromBufferAttribute( position, i );
		particles.push( new Particle( v0.x, v0.y, v0.z, mass ) );

	}

	for ( let i = 0, il = index.count / 3; i < il; i++ ) {

		const i3 = i * 3;

		const a = index.getX( i3 + 0 );
		const b = index.getX( i3 + 1 );
		const c = index.getX( i3 + 2 );

		if ( ! particles[ b ].adj.includes( a ) ) {

			const dist = particles[ a ].original.distanceTo( particles[ b ].original );

			particles[ a ].adj.push( b );
			particles[ b ].adj.push( a );
			constraints.push( [ particles[ a ], particles[ b ], dist * dist ] );

		}

		if ( ! particles[ c ].adj.includes( a ) ) {

			const dist = particles[ a ].original.distanceTo( particles[ c ].original );

			particles[ a ].adj.push( c );
			particles[ c ].adj.push( a );
			constraints.push( [ particles[ a ], particles[ c ], dist * dist ] );

		}

		if ( ! particles[ c ].adj.includes( b ) ) {

			const dist = particles[ b ].original.distanceTo( particles[ c ].original );

			particles[ b ].adj.push( c );
			particles[ c ].adj.push( b );
			constraints.push( [ particles[ b ], particles[ c ], dist * dist ] );

		}

	}

	for ( let i = 0, il = constraints.length; i < il; i++ ) {

		const con = constraints[i];

		let k = 1;
		while ( true ) {

			while ( con[0].colors[k] ) k++;

			if ( ! con[1].colors[k] ) {

				con.push( k );
				con[0].colors[k] = true;
				con[1].colors[k] = true;
				break;

			} else {

				k++;

			}

		}

	}

}

function animate() {

		stats.begin();

		requestAnimationFrame( animate );

		// updateCloth();

		renderer.render( scene, camera );

		stats.end();

}

function updateCloth() {

	updateMouse();
	simulate();

	for ( var i = 0, il = particles.length; i < il; i++ ) {

		const p = particles[ i ].position;

		position.setXYZ( i, p.x, p.y, p.z );

	}

	position.needsUpdate = true;
	mesh.geometry.computeVertexNormals();

}

function updateMouse() {

	if ( ! interacting ) return;

	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObject( mesh );

	if ( intersects.length != 0 ) {

		mouse3d.copy( intersects[0].point );

		if ( psel == undefined ) {

			dist = Infinity;
			for ( i = 0; i < particles.length; i++ ) {

				tmp = mouse3d.distanceTo( particles[i].position );

				if ( tmp < dist ) {
					dist = tmp;
					psel = i;
				}

			}

			for ( i = 0; i < particles.length; i++ ) {

				particles[i].distance = particles[ psel ].original.distanceTo( particles[i].original );

			}

		}

	}

	plane.normal.copy( camera.position ).normalize();
	raycaster.ray.intersectPlane( plane, tmpmouse );

	if ( tmpmouse != null ) {

		mouse3d.copy( tmpmouse );

	}

}

function simulate( ) {

	let il = particles.length;

	for ( let i = 0; i < il; i++ ) {

		particles[ i ].integrate( TIMESTEP_SQ );

	}

	il = constraints.length;

	for ( let j = 0; j < steps; j++ ) {

		// mouse intersect

		if ( interacting && psel ) {

			v0.copy( mouse3d ).sub( particles[ psel ].position ); // offset

			for ( let i = 0; i < particles.length; i++ ) {

				const distance = particles[ psel ].original.distanceTo( particles[i].original );

				if ( particles[i].distance < 15 ) {

					particles[ i ].position.add( v0 );

				}

			}

		}

		for ( let i = il-1; i >= 0; i-- ) {

			constraint = constraints[ i ];
			satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );

		}

		for ( let  i = 0; i < il; i ++ ) {

			constraint = constraints[ i ];
			satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );

		}

	}

}

function satisfyConstraints( p1, p2, distSq ) {

	if ( p2.position.equals( p1.position) ) return;

	v0.subVectors( p2.position, p1.position );

	const curDist = Math.max( distSq * cutoff, v0.lengthSq() );
	const diff = distSq / ( curDist + distSq ) - 0.5;

	v0.multiplyScalar( diff * stiffness );

	p1.position.sub( v0 );
	p2.position.add( v0 );

}

window.onmousemove = function(evt) {

	mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(evt.pageY / window.innerHeight) * 2 + 1;

}

window.onmousedown = function(evt) {

	if (evt.button == 0)
		interacting = true;
}

window.onmouseup = function(evt) {

	if ( evt.button == 0 ) {

		interacting = false;
		psel = undefined;

	}

}

window.onresize = function() {

	const w = window.innerWidth;
	const h = window.innerHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

};
