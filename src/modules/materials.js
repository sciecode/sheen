// shader-import-block
import through_vert from '../glsl/through.vert.js';

import constraints_frag from '../glsl/constraints.frag.js';
import integrate_frag from '../glsl/integrate.frag.js';
import mouse_frag from '../glsl/mouse.frag.js';
import normals_frag from '../glsl/normals.frag.js';
import through_frag from '../glsl/through.frag.js';

const copyShader = new THREE.RawShaderMaterial( {
	uniforms: {
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

const integrateShader = copyShader.clone();
integrateShader.fragmentShader = integrate_frag;
integrateShader.uniforms = {
	dt: { type: 'f' },
	tSize: { type: 'v2' },
	tOriginal: { type: 't' },
	tPrevious: { type: 't' },
	tPosition: { type: 't' }
};

const mouseShader = copyShader.clone();
mouseShader.fragmentShader = mouse_frag;
mouseShader.uniforms = {
	psel: { value: null },
	tSize: { type: 'v2' },
	mouse: { type: 'v3' },
	tOriginal: { type: 't' },
	tPosition: { type: 't' }
};

const constraintsShader = copyShader.clone();
constraintsShader.fragmentShader = constraints_frag;
constraintsShader.uniforms = {
	cID: { value: null },
	tSize: { type: 'v2' },
	tOriginal: { type: 't' },
	tPosition: { type: 't' },
	tConstraints: { type: 't' }
};

const normalsShader = copyShader.clone();
normalsShader.fragmentShader = normals_frag;
normalsShader.uniforms = {
	tSize: { type: 'v2' },
	tPosition: { type: 't' },
	tFace1: { type: 't' },
	tFace2: { type: 't' },
	tFace3: { type: 't' },
};

export { copyShader, integrateShader, mouseShader, constraintsShader, normalsShader }
