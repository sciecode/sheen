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
steps = 50;


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

	// render targets
	originalRT = createRenderTarget();
	targetRT = createRenderTarget();
	previousRT = createRenderTarget();
	positionRT = createRenderTarget();
	normalsRT = createRenderTarget();

	adjacentsRT = Array.from( { length: 2 }, createRenderTarget );
	distancesRT = Array.from( { length: 2 }, createRenderTarget );

	// prepare
	copyTexture( createPositionTexture( ), originalRT );
	copyTexture( originalRT, previousRT );
	copyTexture( originalRT, positionRT );

	// setup relaxed vertices conditions
	for ( let i = 0; i < 2; i++ ) {

		copyTexture( createAdjacentsTexture( i*4 ), adjacentsRT[i] );

	}

	// setup vertices original distances
	for ( let i = 0; i < 2; i++ ) {

		copyTexture( createDistancesTexture( i*4 ), distancesRT[i] );

	}

}

function copyTexture( input, output ) {

	mesh.material = copyShader;
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
		type: THREE.FloatType,
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
	tmp.texture.minFilter = THREE.NearestFilter;
	tmp.texture.magFilter = THREE.NearestFilter;
	tmp.texture.needsUpdate = true;
	tmp.texture.generateMipmaps = false;
	tmp.texture.flipY = false;

	return tmp;

}

function createAdjacentsTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;
		const adj = PRE.adjacency[ i ];
		const len = PRE.adjacency[ i ].length;

		data[ i4 + 0 ] = adj[ k + 0 ];
		data[ i4 + 1 ] = ( len < 6 && k > 0 ) ? - 1 : adj[ k + 1 ];
		data[ i4 + 2 ] = ( k > 0 ) ? - 1 : adj[ k + 2 ];
		data[ i4 + 3 ] = ( k > 0 ) ? - 1 : adj[ k + 3 ];

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.FloatType );
	tmp.texture.minFilter = THREE.NearestFilter;
	tmp.texture.magFilter = THREE.NearestFilter;
	tmp.texture.needsUpdate = true;
	tmp.texture.generateMipmaps = false;
	tmp.texture.flipY = false;

	return tmp;

}

function createDistancesTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	const vert = PRE.vertices;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;
		const adj = PRE.adjacency[ i ];
		const len = PRE.adjacency[ i ].length;

		const v = vert[i];

		data[ i4 + 0 ] = v.distanceTo( vert[ adj[ k + 0 ] ] );
		data[ i4 + 1 ] = ( len < 6 && k > 0 ) ? - 1 : v.distanceTo( vert[ adj[ k + 1 ] ] );
		data[ i4 + 2 ] = ( k > 0 ) ? - 1 : v.distanceTo( vert[ adj[ k + 2 ] ] );
		data[ i4 + 3 ] = ( k > 0 ) ? - 1 : v.distanceTo( vert[ adj[ k + 3 ] ] );

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.FloatType );
	tmp.texture.minFilter = THREE.NearestFilter;
	tmp.texture.magFilter = THREE.NearestFilter;
	tmp.texture.needsUpdate = true;
	tmp.texture.generateMipmaps = false;
	tmp.texture.flipY = false;

	return tmp;

}

function integrate() {

	mesh.material = integrateShader;
	integrateShader.uniforms.tSize.value = tSize;
	integrateShader.uniforms.tOriginal.value = originalRT.texture;
	integrateShader.uniforms.tPrevious.value = previousRT.texture;
	integrateShader.uniforms.tPosition.value = positionRT.texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera );

	const tmp = previousRT;
	previousRT = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function solveConstraints() {

	mesh.material = constraintsShader;
	constraintsShader.uniforms.tSize.value = tSize;
	constraintsShader.uniforms.tPosition.value = positionRT.texture;
	constraintsShader.uniforms.tAdjacentsA.value = adjacentsRT[0].texture;
	constraintsShader.uniforms.tAdjacentsB.value = adjacentsRT[1].texture;
	constraintsShader.uniforms.tDistancesA.value = distancesRT[0].texture;
	constraintsShader.uniforms.tDistancesB.value = distancesRT[1].texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function mouseOffset() {

	mesh.material = mouseShader;
	mouseShader.uniforms.tSize.value = tSize;
	mouseShader.uniforms.psel.value = MOUSE.psel;
	mouseShader.uniforms.mouse.value = MOUSE.mouse3d;
	mouseShader.uniforms.tOriginal.value = originalRT.texture;
	mouseShader.uniforms.tPosition.value = positionRT.texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function computeVertexNormals( ) {

	mesh.material = normalsShader;
	normalsShader.uniforms.tSize.value = tSize;
	normalsShader.uniforms.tPosition.value = positionRT.texture;
	normalsShader.uniforms.tAdjacentsA.value = adjacentsRT[0].texture;
	normalsShader.uniforms.tAdjacentsB.value = adjacentsRT[1].texture;

	renderer.setRenderTarget( normalsRT );
	renderer.render( scene, camera );

}

function update() {

	integrate();

	let mouseUpdating = MOUSE.updating();

	for ( let i = 0; i < steps; i++ ) {

		if ( mouseUpdating && (i+5) < steps ) mouseOffset();

		solveConstraints();

	}

	computeVertexNormals();

}

export { init, update, positionRT, normalsRT };
