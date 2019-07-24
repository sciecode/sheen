import {
	constraintsShader,
	copyShader,
	integrateShader,
	mouseShader,
	normalsShader
} from './materials.js';

let
RESOLUTION, MOUSE,
renderer, mesh, targetRT, normalsRT,
originalRT, previousRT, positionRT,
constraintsRT, facesRT,
steps = 60;

// setup
const
tSize = new THREE.Vector2(),
scene = new THREE.Scene(),
camera = new THREE.Camera();

function init( WebGLRenderer, vertices, particles, mouse ) {

	// setup
	renderer = WebGLRenderer;

	MOUSE = mouse;
	RESOLUTION = Math.ceil( Math.sqrt( vertices.count ) );
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
	copyTexture( createPositionTexture( vertices ), originalRT );
	copyTexture( originalRT, previousRT );
	copyTexture( originalRT, positionRT );

	copyTexture( createConstraintsTexture( particles, 0 ), constraintsRT[0] );
	copyTexture( createConstraintsTexture( particles, 4 ), constraintsRT[1] );

	copyTexture( createFacesTexture( particles, 0 ), facesRT[0] );
	copyTexture( createFacesTexture( particles, 2 ), facesRT[1] );
	copyTexture( createFacesTexture( particles, 4 ), facesRT[2] );

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

function createPositionTexture( vertices, expand ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = vertices.array.length;

	for ( let i = 0; i < RESOLUTION; i++ ) {

		for ( let j = 0; j < RESOLUTION; j++ ) {

			const i3 = i * RESOLUTION * 3 + j * 3;
			const i4 = i * RESOLUTION * 4 + j * 4;

			if ( i3 >= length ) break;

			data[ i4 + 0 ] = vertices.array[ i3 + 0 ];
			data[ i4 + 1 ] = vertices.array[ i3 + 1 ];
			data[ i4 + 2 ] = vertices.array[ i3 + 2 ];

		}

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

function createConstraintsTexture( particles, k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = particles.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = ( particles[i].colors[ k + 0 ] === undefined ) ? -1 : particles[i].colors[ k + 0 ];
		data[ i4 + 1 ] = ( particles[i].colors[ k + 1 ] === undefined ) ? -1 : particles[i].colors[ k + 1 ];
		data[ i4 + 2 ] = ( particles[i].colors[ k + 2 ] === undefined ) ? -1 : particles[i].colors[ k + 2 ];
		data[ i4 + 3 ] = ( particles[i].colors[ k + 3 ] === undefined ) ? -1 : particles[i].colors[ k + 3 ];

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

function createFacesTexture( particles, k ) {

	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = particles.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = ( particles[i].faces[ k + 0 ] === undefined ) ? -1 : particles[i].faces[ k + 0 ][0];
		data[ i4 + 1 ] = ( particles[i].faces[ k + 0 ] === undefined ) ? -1 : particles[i].faces[ k + 0 ][1];
		data[ i4 + 2 ] = ( particles[i].faces[ k + 1 ] === undefined ) ? -1 : particles[i].faces[ k + 1 ][0];
		data[ i4 + 3 ] = ( particles[i].faces[ k + 1 ] === undefined ) ? -1 : particles[i].faces[ k + 1 ][1];

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

		if ( MOUSE.updating() ) mouseOffset();

		for ( let j = 0; j < 8; j++ ) {

			solveConstraints( j );

		}

		for ( let j = 7; j >= 0; j-- ) {

			solveConstraints( j );

		}

	}

	computeVertexNormals();

}

export { init, update, positionRT, normalsRT };