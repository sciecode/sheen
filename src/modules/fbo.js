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
renderer, mesh, targetRT, ntargetRT, normalsRT,
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
	ntargetRT = createRenderTarget();
	previousRT = createRenderTarget();
	positionRT = createRenderTarget();
	normalsRT = createRenderTarget();

	constraintsRT = Array.from( { length: 4 }, createURenderTarget );
	facesRT = Array.from( { length: 6 }, createURenderTarget );

	// prepare
	copyTexture( createPositionTexture( ), originalRT );
	copyTexture( originalRT, previousRT );
	copyTexture( originalRT, positionRT );

	for ( let i = 0; i < 4; i++ ) {

		copyTexture( createConstraintsTexture( i*2 ), constraintsRT[i] );

	}

	for ( let i = 0; i < 6; i++ ) {

		copyTexture( createFacesTexture( i ), facesRT[i] );

	}

}

function copyTexture( input, output ) {

	mesh.material = copyShader;
	copyShader.uniforms.tSize.value = tSize;
	copyShader.uniforms.texture.value = input.texture;

	renderer.setRenderTarget( output );
	renderer.render( scene, camera );

}

function createURenderTarget() {

	return createRenderTarget( true );

}

function createRenderTarget( unsigned ) {

	return new THREE.WebGLRenderTarget( RESOLUTION, RESOLUTION, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: ( unsigned ) ? THREE.UnsignedByteType : THREE.FloatType,
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

	const data = new Uint8Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		for ( let j = 0; j < 2; j++ ) {

			let idx = PRE.colors[ i ][ k + j ];

			if ( idx == undefined ) idx = (length+1);

			data[ i4 + j*2 + 0 ] = idx % 256;
			data[ i4 + j*2 + 1 ] = ~ ~ ( idx / 256 );

		}

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.UnsignedByteType );
	tmp.texture.minFilter = THREE.NearestFilter;
	tmp.texture.magFilter = THREE.NearestFilter;
	tmp.texture.needsUpdate = true;
	tmp.texture.generateMipmaps = false;
	tmp.texture.flipY = false;

	return tmp;

}

function createFacesTexture( k ) {

	const data = new Uint8Array( RESOLUTION * RESOLUTION * 4 );
	const length = PRE.vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		const face = PRE.faces[ i ][ k ];

		for ( let j = 0; j < 2; j++ ) {

			const idx = ( face == undefined ) ? (length+1) : face[j];

			data[ i4 + j*2 + 0 ] = idx % 256;
			data[ i4 + j*2 + 1 ] = ~ ~ ( idx / 256 );

		}

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBAFormat, THREE.UnsignedByteType );
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

	const tID = ~ ~ ( offset / 2 );
	const cID = offset % 2;

	mesh.material = constraintsShader;
	constraintsShader.uniforms.length.value = PRE.vertices.length;
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

function computeVertexNormals( id ) {

	mesh.material = normalsShader;
	normalsShader.uniforms.reset.value = ( id == 0 ) ? 1.0 : 0.0;
	normalsShader.uniforms.length.value = PRE.vertices.length;
	normalsShader.uniforms.tSize.value = tSize;
	normalsShader.uniforms.tPosition.value = positionRT.texture;
	normalsShader.uniforms.tNormal.value = normalsRT.texture;
	normalsShader.uniforms.tFace.value = facesRT[id].texture;

	renderer.setRenderTarget( ntargetRT );
	renderer.render( scene, camera );

	const tmp = normalsRT;
	normalsRT = ntargetRT;
	ntargetRT = tmp;

}

function update() {

	integrate();

	for ( let i = 0; i < steps; i++ ) {

		if ( MOUSE.updating() && ( i+5 ) < steps ) mouseOffset();

		for ( let j = 0; j < 8; j++ ) {

			solveConstraints( j );

		}

	}

	for ( let i = 0; i < 6; i++ ) {

		computeVertexNormals( i );

	}

}

export { init, update, positionRT, normalsRT };
