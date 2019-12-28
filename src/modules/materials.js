// shader-import-block
import through_vert from '../glsl/through.vert.js';

import constraints_frag from '../glsl/constraints.frag.js';
import integrate_frag from '../glsl/integrate.frag.js';
import mouse_frag from '../glsl/mouse.frag.js';
import normals_frag from '../glsl/normals.frag.js';
import through_frag from '../glsl/through.frag.js';


// copyToRenderTarget
const copyShader = new THREE.RawShaderMaterial( {
	uniforms: {
		order: {},
		tSize: { type: 'v2' },
		texture: { type: 't' }
	},
	vertexShader: through_vert,
	fragmentShader: through_frag,
	fog: false,
	lights: false,
	depthWrite: false,
	depthTest: false
});

// forward-integration
const integrateShader = copyShader.clone();
integrateShader.fragmentShader = integrate_frag;
integrateShader.uniforms = {
	dt: { type: 'f' },
	tSize: { type: 'v2' },
	order: {},
	tOriginal: { type: 't' },
	tPrevious0: { type: 't' },
	tPrevious1: { type: 't' },
	tPosition0: { type: 't' },
	tPosition1: { type: 't' }
};

// mouse displacement 
const mouseShader = copyShader.clone();
mouseShader.fragmentShader = mouse_frag;
mouseShader.uniforms = {
	vertices: { value: null },
	coordinates: { type: 'v3' },
	order: {},
	tSize: { type: 'v2' },
	tOriginal: { type: 't' },
	tPosition0: { type: 't' },
	tPosition1: { type: 't' }
};

// vertices relaxation
const constraintsShader = copyShader.clone();
constraintsShader.fragmentShader = constraints_frag;
constraintsShader.uniforms = {
	tSize: { type: 'v2' },
	order: { },
	tPosition0: { type: 't' },
	tPosition1: { type: 't' },
	tAdjacentsA: { type: 't' },
	tAdjacentsB: { type: 't' },
	tDistancesA: { type: 't' },
	tDistancesB: { type: 't' }
};

// calculate normals
const normalsShader = copyShader.clone();
normalsShader.fragmentShader = normals_frag;
normalsShader.uniforms = {
	tSize: { type: 'v2' },
	tPosition0: { type: 't' },
	tPosition1: { type: 't' },
	tAdjacentsA: { type: 't' },
	tAdjacentsB: { type: 't' }

};

export { copyShader, integrateShader, mouseShader, constraintsShader, normalsShader }
