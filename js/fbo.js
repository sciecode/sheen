let RESOLUTION,
renderer, scene, camera, mesh,
originalRT, previousRT, positionRT,
constraintRTs;

function init( renderer, vertices, constraints ) {

	// setup
	renderer = renderer;
	scene = new THREE.Scene();
	camera = new THREE.Camera();

	// geometry
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array( [
		-1.0, -1.0,
		3.0, -1.0,
		-1.0, 3.0
	] );

	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 2 ) );

	// materials
	// copyShader
	// integrateShader
	// mouseShader
	// constraintShader

	// mesh
	// mesh = new THREE.Mesh( geometry, copyShader );
	// mesh.frustumCulled = false;
	// scene.add( mesh );

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
	} );

	previousRT = originalRT.clone();
	positionRT = originalRT.clone();

	constraintRTs = new Array(2);
	constraintRTs[0] = originalRT.clone();
	constraintRTs[1] = originalRT.clone();

}

export { init };
