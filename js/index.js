var steps = 10;
var DRAG = 0.88;
var PULL = 20.5;
var TIMESTEP = 16 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var currentTime = Date.now();
var accumulator = 0;
var dt = TIMESTEP*1000;

let renderer, camera, scene,
controls, mesh, stats,
interacting = false,
psel = undefined;

const particles = [],
constraints = [],

v0 = new THREE.Vector3(),
mouse = new THREE.Vector2(),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
normal = new THREE.Vector3(),

raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -200 ),

texture = new THREE.TextureLoader().load( "https://raw.githubusercontent.com/aatishb/drape/master/textures/patterns/circuit_pattern.png", init );

function init() {

	// core

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	renderer.setClearColor( 0x0f1519 );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 1000 );
	camera.position.z = -100;
	camera.position.y = 110;
	camera.position.x = 160;

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enablePan = false;

	stats = new Stats();
	document.body.appendChild( stats.dom );

	// lights

	const directionalLight = new THREE.DirectionalLight( 0xba8b8b, 1.0 );
	directionalLight.position.set( 1, 1, 1 );
	scene.add( directionalLight );

	const directionalLight2 = new THREE.DirectionalLight( 0x8bbab4, 1.6 );
	directionalLight2.position.set( 1, 1, -1 );
	scene.add( directionalLight2 )

	const light = new THREE.AmbientLight(); // soft white light
	scene.add( light );

	const plight = new THREE.PointLight( 0xffffff, 1.0, 700 );
	plight.position.set( 0, 350, 0 );
	scene.add( plight );


	// mesh

	const material = new THREE.MeshPhysicalMaterial( { color: 0xaa2949 } );

	// const geometry = new THREE.SphereGeometry( 100, 50, 50 );
	const geometry = new THREE.IcosahedronGeometry( 100, 5 );

	console.log( geometry.vertices.length )

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );


	// particles

	createParticles( geometry );

	animate();

}

function createParticles( geometry ) {


	for ( let i = 0; i < geometry.vertices.length; i++ ) {

		const t = geometry.vertices[i];
		particles.push( new Particle( t.x, t.y, t.z, 0.1) );

	}

	for ( let i = 0; i < geometry.faces.length; i++ ) {

		const face = geometry.faces[i];

		if ( ! particles[ face.b ].adj.includes( face.a ) ) {

			const dist = particles[ face.a ].original.distanceTo( particles[ face.b ].original );

			particles[ face.a ].adj.push( face.b );
			particles[ face.b ].adj.push( face.a );
			constraints.push( [ particles[ face.a ], particles[ face.b ], dist ] );

		}

		if ( ! particles[ face.c ].adj.includes( face.a ) ) {

			const dist = particles[ face.a ].original.distanceTo( particles[ face.c ].original );

			particles[ face.a ].adj.push( face.c );
			particles[ face.c ].adj.push( face.a );
			constraints.push( [ particles[ face.a ], particles[ face.c ], dist ] );

		}

		if ( ! particles[ face.c ].adj.includes( face.b ) ) {

			const dist = particles[ face.b ].original.distanceTo( particles[ face.c ].original );

			particles[ face.b ].adj.push( face.c );
			particles[ face.c ].adj.push( face.b );
			constraints.push( [ particles[ face.b ], particles[ face.c ], dist ] );

		}

	}

}

function animate() {

		requestAnimationFrame( animate );

		stats.begin();

		updateCloth();

		controls.update();

		renderer.render( scene, camera );

		stats.end();

}

function updateCloth() {

	updateMouse();
	simulate();

	for ( var i = 0, il = particles.length; i < il; i++ ) {

		mesh.geometry.vertices[ i ].copy( particles[ i ].position );

	}

	mesh.geometry.computeFaceNormals();
	mesh.geometry.computeVertexNormals();

	mesh.geometry.normalsNeedUpdate = true;
	mesh.geometry.verticesNeedUpdate = true;

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

		const particle = particles[ i ];

		v0.copy( particle.original );
		particle.addForce( v0.sub( particle.position ).multiplyScalar( PULL ) );
		particle.integrate( TIMESTEP_SQ );

	}

	il = constraints.length;

	for ( j = 0; j < steps; j++ ) {

		// mouse intersect

		if ( interacting && psel ) {

			v0.copy(mouse3d).sub( particles[ psel ].position ); // offset

			for ( let i = 0; i < particles.length; i++ ) {

				const distance = particles[ psel ].original.distanceTo( particles[i].original );

				if ( particles[i].distance < 10 ) {

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

function satisfyConstraints( p1, p2, distance ) {

		v0.subVectors( p2.position, p1.position );
		var currentDist = v0.length();

		if ( currentDist === 0 ) return; // prevents division by 0

		var correction = v0.multiplyScalar( 1 - distance / currentDist );
		var correctionHalf = correction.multiplyScalar( 0.5 );

		p1.position.add( correctionHalf );
		p2.position.sub( correctionHalf );

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

	w = window.innerWidth;
	h = window.innerHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

};
