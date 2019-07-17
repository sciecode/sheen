// shader-import-block
import through_vert from '../glsl/through.vert.js';
import through_frag from '../glsl/through.frag.js';
import integrate_frag from '../glsl/integrate.frag.js';
// import position_frag from '../glsl/position.frag.js';
// import velocity_frag from '../glsl/velocity.frag.js';

let RESOLUTION,
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

	constraintShader = new THREE.RawShaderMaterial( {
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
	} );

function init( WebGLRenderer, vertices, constraints ) {

	// setup
	renderer = WebGLRenderer;

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
		format: THREE.RGBAFormat,
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

	// prepare
	copyTexture( createPositionTexture( vertices ), originalRT );
	copyTexture( createPositionTexture( vertices, true ), previousRT );
	copyTexture( previousRT, positionRT );

}

function copyTexture( input, output ) {

	mesh.material = copyShader;
	copyShader.uniforms.texture.value = input.texture;

	renderer.setRenderTarget( output );
	renderer.render( scene, camera );

}

function createPositionTexture( vertices, expand ) {

	const exp = ( expand ) ? 1.5 : 1;
	const data = new Float32Array( RESOLUTION * RESOLUTION * 4 );
	const length = vertices.array.length;

	for ( let i = 0; i < RESOLUTION; i++ ) {

		for ( let j = 0; j < RESOLUTION; j++ ) {

			const i4 = i * RESOLUTION * 4 + j * 4;
			const i3 = i * RESOLUTION * 3 + j * 3;

			if ( i3 >= length ) break;

			data[ i4 + 0 ] = vertices.array[ i3 + 0 ] * exp;
			data[ i4 + 1 ] = vertices.array[ i3 + 1 ] * exp;
			data[ i4 + 2 ] = vertices.array[ i3 + 2 ] * exp;

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

function update() {

	integrate();

}

export { init, update, positionRT };
