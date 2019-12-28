import * as PRE from './pre.js';

let camera;

const
pointers = {},
vertices = new Array( 3 ),
coordinates = new Array( 3 ),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -1.8 ),
sphere = new THREE.Sphere( undefined, 1 );


function init( PerspectiveCamera ) {

	camera = PerspectiveCamera;
	plane.normal.copy( camera.position ).normalize();

	window.addEventListener('mousemove', onMouseMove );
	window.addEventListener('mousedown', onMouseDown );
	window.addEventListener('mouseout', onMouseOut );
	window.addEventListener('mouseup', onMouseUp );

	window.addEventListener('touchmove', onTouchMove, { passive: false } );
	window.addEventListener('touchstart', onTouchDown, { passive: false } );
	window.addEventListener('touchend', onTouchUp );

}

function updating() {

	let count = 0;
	let isUpdating = false;

	for ( let [ key, value ] of Object.entries( pointers ) ) {

		let mouse = value.screenCoordinate;

		raycaster.setFromCamera( mouse, camera );

		if ( value.vertex === undefined &&
			 raycaster.ray.intersectSphere( sphere, tmpmouse ) != null ) {

			mouse3d.copy( tmpmouse );

			let dist = Infinity;

			for ( let i = 0; i < PRE.vertices.length; ++i ) {

				const tmp = mouse3d.distanceTo( PRE.vertices[ i ] );

				if ( tmp < dist ) {

					dist = tmp;
					value.vertex = i;

				}

			}

		}

		if ( value.vertex !== undefined ) {
			
			isUpdating = true;
			raycaster.ray.intersectPlane( plane, tmpmouse );
			value.worldCoordinate.copy( tmpmouse );

			vertices[ count ] = value.vertex;
			coordinates[ count ] = value.worldCoordinate;

			count++;

		}

	}

	while ( count < 3 ) {

		vertices[ count ] = -1;
		coordinates[ count ] = mouse3d;

		count++;

	}

	return ( isUpdating ) ? true : false;

}

function onMouseMove( evt ) {

	if ( pointers[ 'mouse' ] !== undefined ) {

		pointers[ 'mouse' ].screenCoordinate.x = ( evt.pageX / window.innerWidth ) * 2 - 1;
		pointers[ 'mouse' ].screenCoordinate.y = - ( evt.pageY / window.innerHeight ) * 2 + 1;

	}

}

function onMouseDown( evt ) {

	if ( evt.button == 0 ) {

		pointers[ 'mouse' ] = { 

			vertex: undefined,
			screenCoordinate: new THREE.Vector2(),
			worldCoordinate: new THREE.Vector3()

		}

		onMouseMove( evt );

	}

}

function onMouseUp( evt ) {

	if ( evt.button == 0 ) {

		delete pointers[ 'mouse' ];

	}

}

function onMouseOut() {

	delete pointers[ 'mouse' ];

}

function onTouchMove( evt ) {

	evt.preventDefault();

	for ( let i = 0; i < evt.changedTouches.length; ++i ) {

		let touch = evt.changedTouches[ i ];

		pointers[ touch.identifier ].screenCoordinate.x = ( touch.pageX / window.innerWidth ) * 2 - 1;
		pointers[ touch.identifier ].screenCoordinate.y = - ( touch.pageY / window.innerHeight ) * 2 + 1;

	}

}

function onTouchDown( evt ) {

	for ( let i = 0; i < evt.changedTouches.length; ++i ) {

		let touch = evt.changedTouches[ i ];

		pointers[ touch.identifier ] = { 

			vertex: undefined,
			screenCoordinate: new THREE.Vector2(),
			worldCoordinate: new THREE.Vector3()

		}

	}

	onTouchMove( evt );

}

function onTouchUp( evt ) {

	for ( let i = 0; i < evt.changedTouches.length; ++i ) {

		let touch = evt.changedTouches[ i ];

		delete pointers[ touch.identifier ];

	}

}

export { init, updating, vertices, coordinates }
