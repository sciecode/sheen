// shader-import-block
import through_vert from '../glsl/through.vert.js';
import through_frag from '../glsl/through.frag.js';
import mouse_frag from '../glsl/mouse.frag.js';
import integrate_frag from '../glsl/integrate.frag.js';
import constraints_frag from '../glsl/constraints.frag.js';

let RESOLUTION, MOUSE,
	renderer, mesh,
	originalRT, previousRT, positionRT, targetRT,
	constraintRTs;

// setup
const tSize = new THREE.Vector2(),
	scene = new THREE.Scene(),
	camera = new THREE.Camera(),

	// materials
	copyShader = new THREE.RawShaderMaterial( {
		uniforms: {
			tSize: { type: 'v2', value: tSize },
			texture: { type: 't' }
		},
		vertexShader: through_vert,
		fragmentShader: through_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} ),

	integrateShader = new THREE.RawShaderMaterial( {
		uniforms: {
			tSize: { type: 'v2', value: tSize },
			tOriginal: { type: 't' },
			tPrevious: { type: 't' },
			tPosition: { type: 't' }
		},
		vertexShader: through_vert,
		fragmentShader: integrate_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} ),

	mouseShader = new THREE.RawShaderMaterial( {
		uniforms: {
			psel: { value: null },
			mouse: { type: 'v3' },
			tSize: { type: 'v2', value: tSize },
			tOriginal: { type: 't' }
		},
		vertexShader: through_vert,
		fragmentShader: mouse_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} ),

	constraintsShader = new THREE.RawShaderMaterial( {
		uniforms: {
			cID: { value: null },
			tSize: { type: 'v2', value: tSize },
			tOriginal: { type: 't' },
			tPosition: { type: 't' },
			tConstraints: { type: 't' }
		},
		vertexShader: through_vert,
		fragmentShader: constraints_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} );

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
	originalRT = new THREE.WebGLRenderTarget( RESOLUTION, RESOLUTION, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBFormat,
		type: THREE.FloatType,
		depthTest: false,
		depthWrite: false,
		depthBuffer: false,
		stencilBuffer: false
	} ),

	constraintRTs = new Array(2);
	targetRT = originalRT.clone();
	previousRT = originalRT.clone();
	positionRT = originalRT.clone();

	constraintRTs[0] = originalRT.clone();
	constraintRTs[1] = originalRT.clone();

	constraintRTs[0].texture.format = THREE.RGBAFormat;
	constraintRTs[1].texture.format = THREE.RGBAFormat;

	// prepare
	copyTexture( createPositionTexture( vertices ), originalRT );
	copyTexture( originalRT, previousRT );
	copyTexture( originalRT, positionRT );

	copyTexture( createConstraintsTexture( particles, 0 ), constraintRTs[0] );
	copyTexture( createConstraintsTexture( particles, 4 ), constraintRTs[1] );

}

function copyTexture( input, output ) {

	mesh.material = copyShader;
	copyShader.uniforms.texture.value = input.texture;

	renderer.setRenderTarget( output );
	renderer.render( scene, camera );

}

function createPositionTexture( vertices, expand ) {

	const exp = ( expand ) ? 1.5 : 1;
	const data = new Float32Array( RESOLUTION * RESOLUTION * 3 );
	const length = vertices.array.length;

	for ( let i = 0; i < RESOLUTION; i++ ) {

		for ( let j = 0; j < RESOLUTION; j++ ) {

			const i3 = i * RESOLUTION * 3 + j * 3;

			if ( i3 >= length ) break;

			data[ i3 + 0 ] = vertices.array[ i3 + 0 ] * exp;
			data[ i3 + 1 ] = vertices.array[ i3 + 1 ] * exp;
			data[ i3 + 2 ] = vertices.array[ i3 + 2 ] * exp;

		}

	}

	const tmp = {};
	tmp.texture = new THREE.DataTexture( data, RESOLUTION, RESOLUTION, THREE.RGBFormat, THREE.FloatType );
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

function integrate() {

	mesh.material = integrateShader;
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
	constraintsShader.uniforms.cID.value = cID;
	constraintsShader.uniforms.tOriginal.value = originalRT.texture;
	constraintsShader.uniforms.tPosition.value = positionRT.texture;
	constraintsShader.uniforms.tConstraints.value = constraintRTs[tID].texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function mouseOffset() {

	mesh.material = mouseShader;
	mouseShader.uniforms.psel.value = MOUSE.psel;
	mouseShader.uniforms.mouse.value = MOUSE.mouse3d;
	mouseShader.uniforms.tOriginal.value = originalRT.texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function update() {

	integrate();

	for ( let i = 0; i < 40; i++ ) {

		if ( MOUSE.update() ) mouseOffset();

		for ( let j = 0; j < 8; j++ ) {

			const k = ( i & 1 == 0 ) ? j : 7-j;

			solveConstraints( k );

		}

	}

}

export { init, update, positionRT };
