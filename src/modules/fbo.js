import * as PRE from './pre.js';
import * as MOUSE from './mouse.js';

import {
	constraintsShader,
	copyShader,
	integrateShader,
	mouseShader,
	normalsShader
} from './materials.js';

let
RESOLUTION,
renderer, mesh, targetRT, normalsRT,
originalRT, previousRT, positionRT,
adjacentsRT, distancesRT,
steps = 40;


const
tSize = new THREE.Vector2(),
scene = new THREE.Scene(),
camera = new THREE.Camera();

function init( WebGLRenderer ) {

	// setup
	renderer = WebGLRenderer;

	RESOLUTION = Math.ceil( Math.sqrt( PRE.vertices.length ) );
	tSize.set( RESOLUTION, RESOLUTION );

	// geometry
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array( [
		-1.0, -1.0,
		3.0, -1.0,
		-1.0, 3.0
	] );

	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 2 ) );

	// mesh
	mesh = new THREE.Mesh( geometry, copyShader );
	mesh.frustumCulled = false;
	scene.add( mesh );

	scene.updateMatrixWorld = function() {};

	adjacentsRT = new Array( 2 );
	distancesRT = new Array( 2 );
	positionRT = new Array( 2 );
	previousRT = new Array( 2 );
	targetRT = new Array( 2 );

	normalsRT = createRenderTarget();

	// prepare
	createPositionTexture();

	// setup relaxed vertices conditions
	for ( let i = 0; i < 2; i++ ) {

		createAdjacentsTexture( i );
		createDistancesTexture( i );

		positionRT[ i ] = createRenderTarget();
		previousRT[ i ] = createRenderTarget();
		targetRT[ i ] = createRenderTarget();

		copyTexture( originalRT, positionRT[ i ], !i );
		copyTexture( originalRT, previousRT[ i ], !i );

	}

}

function copyTexture( input, output, order ) {

	mesh.material = copyShader;
	copyShader.uniforms.order.value = ( order ) ? 1 : - 1;
	copyShader.uniforms.tSize.value = tSize;
	copyShader.uniforms.texture.value = input.texture;

	renderer.setRenderTarget( output );
	renderer.render( scene, camera );

}

function createRenderTarget( ) {

	return new THREE.WebGLRenderTarget( RESOLUTION, RESOLUTION, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
		depthTest: false,
		depthWrite: false,
		depthBuffer: false,
		stencilBuffer: false
	} );

}

function createPositionTexture( ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = PRE.vertices[ i ].x;
		data[ i4 + 1 ] = PRE.vertices[ i ].y;
		data[ i4 + 2 ] = PRE.vertices[ i ].z;

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.FloatType );
	tmp.texture.needsUpdate = true;

	originalRT = tmp;

}

function createAdjacentsTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;
		const adj = PRE.adjacency[ i ];
		const len = PRE.adjacency[ i ].length - 1;

		for ( let j = 0; j < 4; j++ )
			data[ i4 + j ] = ( len < k * 4 + j ) ? - 1 : adj[ k * 4 + j ];

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.FloatType );
	tmp.texture.needsUpdate = true;

	adjacentsRT[ k ] = tmp;

}

function createDistancesTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	const vert = PRE.vertices;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;
		const adj = PRE.adjacency[ i ];
		const len = PRE.adjacency[ i ].length - 1;

		const v = vert[ i ];

		for ( let j = 0; j < 4; j++ )
			data[ i4 + j ] = ( len < k * 4 + j ) ? - 1 : v.distanceTo( vert[ adj[ k * 4 + j ] ] );

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.FloatType );
	tmp.texture.needsUpdate = true;

	distancesRT[ k ] = tmp;

}

function integrate() {

	mesh.material = integrateShader;
	integrateShader.uniforms.tSize.value = tSize;
	integrateShader.uniforms.tOriginal.value = originalRT.texture;
	integrateShader.uniforms.tPrevious0.value = previousRT[ 0 ].texture;
	integrateShader.uniforms.tPrevious1.value = previousRT[ 1 ].texture;
	integrateShader.uniforms.tPosition0.value = positionRT[ 0 ].texture;
	integrateShader.uniforms.tPosition1.value = positionRT[ 1 ].texture;

	// integer-part
	integrateShader.uniforms.order.value = 1;
	renderer.setRenderTarget( targetRT[ 0 ] );
	renderer.render( scene, camera );

	// fraction-part
	integrateShader.uniforms.order.value = -1;
	renderer.setRenderTarget( targetRT[ 1 ] );
	renderer.render( scene, camera );


	// swap framebuffers
	let tmp = previousRT[ 0 ];
	previousRT[ 0 ] = positionRT[ 0 ];
	positionRT[ 0 ] = targetRT[ 0 ];
	targetRT[ 0 ] = tmp;

	tmp = previousRT[ 1 ];
	previousRT[ 1 ] = positionRT[ 1 ];
	positionRT[ 1 ] = targetRT[ 1 ];
	targetRT[ 1 ] = tmp;

}

function solveConstraints() {

	mesh.material = constraintsShader;
	constraintsShader.uniforms.tSize.value = tSize;
	constraintsShader.uniforms.tPosition0.value = positionRT[ 0 ].texture;
	constraintsShader.uniforms.tPosition1.value = positionRT[ 1 ].texture;
	constraintsShader.uniforms.tAdjacentsA.value = adjacentsRT[ 0 ].texture;
	constraintsShader.uniforms.tAdjacentsB.value = adjacentsRT[ 1 ].texture;
	constraintsShader.uniforms.tDistancesA.value = distancesRT[ 0 ].texture;
	constraintsShader.uniforms.tDistancesB.value = distancesRT[ 1 ].texture;

	// integer-part
	constraintsShader.uniforms.order.value = 1;
	renderer.setRenderTarget( targetRT[ 0 ] );
	renderer.render( scene, camera );

	// fraction-part
	constraintsShader.uniforms.order.value = -1;
	renderer.setRenderTarget( targetRT[ 1 ] );
	renderer.render( scene, camera );


	// swap framebuffers
	let tmp = positionRT[ 0 ];
	positionRT[ 0 ] = targetRT [ 0 ];
	targetRT[ 0 ] = tmp;

	tmp = positionRT[ 1 ];
	positionRT[ 1 ] = targetRT [ 1 ];
	targetRT[ 1 ] = tmp;

}

function mouseOffset() {

	mesh.material = mouseShader;
	mouseShader.uniforms.tSize.value = tSize;
	mouseShader.uniforms.vertices.value = MOUSE.vertices;
	mouseShader.uniforms.coordinates.value = MOUSE.coordinates;
	mouseShader.uniforms.tOriginal.value = originalRT.texture;
	mouseShader.uniforms.tPosition0.value = positionRT[ 0 ].texture;
	mouseShader.uniforms.tPosition1.value = positionRT[ 1 ].texture;

	// integer-part
	mouseShader.uniforms.order.value = 1;
	renderer.setRenderTarget( targetRT[ 0 ] );
	renderer.render( scene, camera );

	// fraction-part
	mouseShader.uniforms.order.value = -1;
	renderer.setRenderTarget( targetRT[ 1 ] );
	renderer.render( scene, camera );


	// swap framebuffers
	let tmp = positionRT[ 0 ];
	positionRT[ 0 ] = targetRT [ 0 ];
	targetRT[ 0 ] = tmp;

	tmp = positionRT[ 1 ];
	positionRT[ 1 ] = targetRT [ 1 ];
	targetRT[ 1 ] = tmp;

}

function computeVertexNormals( ) {

	mesh.material = normalsShader;
	normalsShader.uniforms.tSize.value = tSize;
	normalsShader.uniforms.tPosition0.value = positionRT[ 0 ].texture;
	normalsShader.uniforms.tPosition1.value = positionRT[ 1 ].texture;
	normalsShader.uniforms.tAdjacentsA.value = adjacentsRT[ 0 ].texture;
	normalsShader.uniforms.tAdjacentsB.value = adjacentsRT[ 1 ].texture;

	renderer.setRenderTarget( normalsRT );
	renderer.render( scene, camera );

}

function update() {

	integrate();

	let mouseUpdating = MOUSE.updating();

	for ( let i = 0; i < steps; i++ ) {

		if ( mouseUpdating && i < steps - 5 ) mouseOffset();

		solveConstraints();

	}

	computeVertexNormals();

}

export { init, update, positionRT, normalsRT };
