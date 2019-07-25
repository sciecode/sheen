import * as PRE from './pre.js';

let
camera, object,
interacting = false,
psel = undefined;

const
mouse = new THREE.Vector2(),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -180 ),
sphere = new THREE.Sphere( undefined, 100 );


function init( PerspectiveCamera ) {

	camera = PerspectiveCamera;

	window.addEventListener('mousemove', onMouseMove );
	window.addEventListener('mousedown', onMouseDown );
	window.addEventListener('mouseup', onMouseUp );

}

function updating() {

	if ( ! interacting ) return;

	raycaster.setFromCamera( mouse, camera );

	if ( raycaster.ray.intersectSphere( sphere, tmpmouse ) != null ) {

		mouse3d.copy( tmpmouse );

		if ( psel == undefined ) {

			let dist = Infinity;
			for ( let i = 0; i < PRE.vertices.length; i++ ) {

				const tmp = mouse3d.distanceTo( PRE.vertices[i] );

				if ( tmp < dist ) {

					dist = tmp;
					psel = i;

				}

			}

		}

	}

	plane.normal.copy( camera.position ).normalize();

	if ( raycaster.ray.intersectPlane( plane, tmpmouse ) != null ) {

		mouse3d.copy( tmpmouse );

	}

	return ( interacting && psel ) ? true : false;

}

function onMouseMove( evt ) {

	mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(evt.pageY / window.innerHeight) * 2 + 1;

}

function onMouseDown( evt ) {

	if ( evt.button == 0 ) {

		interacting = true;

	}

}

function onMouseUp( evt ) {

	if ( evt.button == 0 ) {

		interacting = false;
		psel = undefined;

	}

}

export { init, updating, mouse3d, psel }
