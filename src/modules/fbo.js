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
constraintsRT, facesRT,
steps = 60;

// setup
const
tSize = new THREE.Vector2(),
scene = new THREE.Scene(),
camera = new THREE.Camera(),
clock = new THREE.Clock();

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

	// render targets
	originalRT = createRenderTarget();
	targetRT = createRenderTarget();
	previousRT = createRenderTarget();
	positionRT = createRenderTarget();
	normalsRT = createRenderTarget();

	constraintsRT = Array.from( { length: 2 }, createRenderTarget );
	facesRT = Array.from( { length: 3 }, createRenderTarget );

	// prepare
	copyTexture( createPositionTexture( ), originalRT );
	copyTexture( originalRT, previousRT );
	copyTexture( originalRT, positionRT );

	copyTexture( createConstraintsTexture( 0 ), constraintsRT[0] );
	copyTexture( createConstraintsTexture( 4 ), constraintsRT[1] );

	copyTexture( createFacesTexture( 0 ), facesRT[0] );
	copyTexture( createFacesTexture( 2 ), facesRT[1] );
	copyTexture( createFacesTexture( 4 ), facesRT[2] );

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

function createConstraintsTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = ( PRE.colors[ i ][ k + 0 ] === undefined ) ? -1 : PRE.colors[ i ][ k + 0 ];
		data[ i4 + 1 ] = ( PRE.colors[ i ][ k + 1 ] === undefined ) ? -1 : PRE.colors[ i ][ k + 1 ];
		data[ i4 + 2 ] = ( PRE.colors[ i ][ k + 2 ] === undefined ) ? -1 : PRE.colors[ i ][ k + 2 ];
		data[ i4 + 3 ] = ( PRE.colors[ i ][ k + 3 ] === undefined ) ? -1 : PRE.colors[ i ][ k + 3 ];

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

function createFacesTexture( k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = ( PRE.faces[ i ][ k + 0 ] === undefined ) ? -1 : PRE.faces[ i ][ k + 0 ][0];
		data[ i4 + 1 ] = ( PRE.faces[ i ][ k + 0 ] === undefined ) ? -1 : PRE.faces[ i ][ k + 0 ][1];
		data[ i4 + 2 ] = ( PRE.faces[ i ][ k + 1 ] === undefined ) ? -1 : PRE.faces[ i ][ k + 1 ][0];
		data[ i4 + 3 ] = ( PRE.faces[ i ][ k + 1 ] === undefined ) ? -1 : PRE.faces[ i ][ k + 1 ][1];

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

	let dt = clock.getDelta();
	dt = ( dt > 0.016 ) ? 0.016 : dt;

	mesh.material = integrateShader;
	integrateShader.uniforms.tSize.value = tSize;
	integrateShader.uniforms.dt.value = dt;
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

function solveConstraints( offset ) {

	const tID = ( offset < 4 ) ? 0 : 1;
	const cID = offset % 4;

	mesh.material = constraintsShader;
	constraintsShader.uniforms.tSize.value = tSize;
	constraintsShader.uniforms.cID.value = cID;
	constraintsShader.uniforms.tOriginal.value = originalRT.texture;
	constraintsShader.uniforms.tPosition.value = positionRT.texture;
	constraintsShader.uniforms.tConstraints.value = constraintsRT[tID].texture;

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

function computeVertexNormals() {

	mesh.material = normalsShader;
	normalsShader.uniforms.tSize.value = tSize;
	normalsShader.uniforms.tPosition.value = positionRT.texture;
	normalsShader.uniforms.tFace1.value = facesRT[0].texture;
	normalsShader.uniforms.tFace2.value = facesRT[1].texture;
	normalsShader.uniforms.tFace3.value = facesRT[2].texture;

	renderer.setRenderTarget( normalsRT );
	renderer.render( scene, camera );

}

function update() {

	integrate();

	for ( let i = 0; i < steps; i++ ) {

		if ( MOUSE.updating() && (i+5) < steps ) mouseOffset();

		for ( let j = 0; j < 8; j++ ) {

			solveConstraints( j );

		}

	}

	computeVertexNormals();

}

export { init, update, positionRT, normalsRT };
