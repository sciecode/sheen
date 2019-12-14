import * as PRE from './pre.js';

let
camera,
interacting = false,
psel = undefined;

const
mouse = new THREE.Vector2(),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -1.8 ),
sphere = new THREE.Sphere( undefined, 1 );


function init( PerspectiveCamera ) {

	camera = PerspectiveCamera;

	window.addEventListener('mousemove', onMouseMove );
	window.addEventListener('mousedown', onMouseDown );
	window.addEventListener('mouseout', onMouseOut );
	window.addEventListener('mouseup', onMouseUp );

	window.addEventListener('touchmove', onTouchMove, { passive: false } );
	window.addEventListener('touchstart', onTouchDown );
	window.addEventListener('touchend', onTouchUp );

}

function updating() {

	if ( ! interacting ) return false;

	raycaster.setFromCamera( mouse, camera );

	if ( raycaster.ray.intersectSphere( sphere, tmpmouse ) != null ) {

		mouse3d.copy( tmpmouse );

		if ( psel == undefined ) {

			let dist = Infinity;
			for ( let i = 0; i < PRE.vertices.length; i++ ) {

				const tmp = mouse3d.distanceTo( PRE.vertices[ i ] );

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

function onMouseOut() {

	interacting = false;
	psel = undefined;

}

function onTouchMove( evt ) {

	evt.preventDefault();

	mouse.x = (evt.touches[0].pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(evt.touches[0].pageY / window.innerHeight) * 2 + 1;

}

function onTouchDown( evt ) {

	interacting = true;

	mouse.x = (evt.touches[0].pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(evt.touches[0].pageY / window.innerHeight) * 2 + 1;

}

function onTouchUp( ) {

	interacting = false;
	psel = undefined;

}

export { init, updating, mouse3d, psel }
