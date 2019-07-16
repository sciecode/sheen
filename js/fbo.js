// shader-import-block
import quad_vert from '../glsl/quad.vert.js';
import through_frag from '../glsl/through.frag.js';
// import position_frag from '../glsl/position.frag.js';
// import velocity_frag from '../glsl/velocity.frag.js';

let RESOLUTION,
	renderer, mesh;

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
		vertexShader: quad_vert,
		fragmentShader: through_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} ),

	integrateShader = new THREE.RawShaderMaterial( {
		uniforms: {
			tSize: { type: 'v2', value: tSize },
			texture: { type: 't' }
		},
		vertexShader: quad_vert,
		fragmentShader: through_frag,
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
		vertexShader: quad_vert,
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
		vertexShader: quad_vert,
		fragmentShader: through_frag,
		fog: false,
		lights: false,
		depthWrite: false,
		depthTest: false
	} ),

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

	constraintRTs = new Array(2),
	previousRT = originalRT.clone(),
	positionRT = originalRT.clone();

	constraintRTs[0] = originalRT.clone();
	constraintRTs[1] = originalRT.clone();

function init( renderer, vertices, constraints ) {

	// setup
	renderer = renderer;

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

	// prepare


}

export { init };
