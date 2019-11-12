function init( scene ) {

	const material = new THREE.MeshPhysicalMaterial( {

		color: 0x393939,
		metalness: 0.9,
		roughness: 0.4,
		dithering: true

	} );

	const geometry = new THREE.PlaneBufferGeometry( 16000, 16000 );

	const object = new THREE.Mesh( geometry, material );
	object.receiveShadow = true;
	object.rotation.x += Math.PI * 0.9;
	object.position.set( 0, -100, 2000 );

	scene.add( object );

}

let
geometry,
faces, colors,
vertices = new Array(),
constraints = new Array();

function calculate( ) {

	const tmp = new THREE.IcosahedronBufferGeometry( 100, 5 );
	geometry = THREE.BufferGeometryUtils.mergeVertices( tmp, 1.5 );

	populateVertices();

	faces = Array.from( { length: vertices.length }, () => new Array() );
	colors = Array.from( { length: vertices.length }, () => new Array( 8 ).fill() );

	populateConstraints();

	populateColors();

}

function populateVertices( ) {

	const v0 = new THREE.Vector3();
	const position = geometry.attributes.position;

	for ( let i = 0, il = position.count; i < il; i++ ) {

		v0.fromBufferAttribute( position, i );
		vertices.push( v0.clone() );

	}

}

function populateConstraints( ) {

	const index = geometry.index;
	const adjacency = Array.from( { length: vertices.length }, () => new Array() );

	for ( let i = 0, il = index.count / 3; i < il; i++ ) {

		const i3 = i * 3;

		const a = index.getX( i3 + 0 );
		const b = index.getX( i3 + 1 );
		const c = index.getX( i3 + 2 );

		faces[a].push( [ b, c ] );
		faces[b].push( [ c, a ] );
		faces[c].push( [ a, b ] );

		if ( ! adjacency[b].includes( a ) ) {

			adjacency[a].push( b );
			adjacency[b].push( a );
			constraints.push( [ a, b ] );

		}

		if ( ! adjacency[c].includes( a ) ) {

			adjacency[a].push( c );
			adjacency[c].push( a );
			constraints.push( [ a, c ] );

		}

		if ( ! adjacency[c].includes( b ) ) {

			adjacency[b].push( c );
			adjacency[c].push( b );
			constraints.push( [ b, c ] );

		}

	}

}

function populateColors( ) {

	// naive edge-coloring implementation, should be optimized.
	for ( let i = 0, il = constraints.length; i < il; i++ ) {

		const con = constraints[i];

		let k = 0;
		while ( true ) {

			while ( colors[ con[0] ][k] !== undefined ) k++;

			if ( colors[ con[1] ][k] === undefined ) {

				colors[ con[0] ][k] = con[1];
				colors[ con[1] ][k] = con[0];
				break;

			} else {

				k++;

			}

		}

	}

}

function dispose( ) {

	faces = undefined;
	colors = undefined;
	constraints = undefined;

}

let 
camera, interacting = false,
psel = undefined;

const
mouse = new THREE.Vector2(),
tmpmouse = new THREE.Vector3(),
mouse3d = new THREE.Vector3(),
raycaster = new THREE.Raycaster(),
plane = new THREE.Plane( undefined, -180 ),
sphere = new THREE.Sphere( undefined, 100 );


function init$1( PerspectiveCamera ) {

	camera = PerspectiveCamera;

	window.addEventListener('mousemove', onMouseMove );
	window.addEventListener('mousedown', onMouseDown );
	window.addEventListener('mouseup', onMouseUp );

}

function updating() {

	if ( ! interacting ) return false;

	raycaster.setFromCamera( mouse, camera );

	if ( raycaster.ray.intersectSphere( sphere, tmpmouse ) != null ) {

		mouse3d.copy( tmpmouse );

		if ( psel == undefined ) {

			let dist = Infinity;
			for ( let i = 0; i < vertices.length; i++ ) {

				const tmp = mouse3d.distanceTo( vertices[i] );

				if ( tmp < dist ) {

					dist = tmp;
					psel = i;

				}

			}

		}

	}

	plane.normal.copy( camera.position ).normalize();

	if ( raycaster.ray.intersectPlane( plane, tmpmouse ) != null ) {

		mouse3d.copy( tmpmouse );

	}

	return ( interacting && psel ) ? true : false;

}

function onMouseMove( evt ) {

	mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(evt.pageY / window.innerHeight) * 2 + 1;

}

function onMouseDown( evt ) {

	if ( evt.button == 0 ) {

		interacting = true;

	}

}

function onMouseUp( evt ) {

	if ( evt.button == 0 ) {

		interacting = false;
		psel = undefined;

	}

}

var through_vert = /* glsl */`
precision highp float;

attribute vec2 position;

void main() {

	gl_Position = vec4( position, vec2(1.0) );

}
`;

var constraints_frag = /* glsl */`
precision highp float;

uniform int cID;
uniform float length;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tOriginal;
uniform sampler2D tConstraints;

vec2 getUV( float id ) {

	float div = id / tSize.x;
	float d = floor( div );

	float y = d / tSize.x;
	float x = div - d;

	float off = 0.5 / tSize.x;

	return vec2( x + off, y + off );

}

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec3 orgA = texture2D( tOriginal, uv ).xyz;
	vec3 posA = texture2D( tPosition, uv ).xyz;

	float idx;
	
	vec2 idxColor = ( cID == 0 ) ? texture2D( tConstraints, uv ).xy : texture2D( tConstraints, uv ).zw;

	idx = idxColor.r * 255.0 + idxColor.g * 255.0 * 256.0;

	uv = getUV( idx );

	vec3 orgB = texture2D( tOriginal, uv ).xyz;
	vec3 posB = texture2D( tPosition, uv ).xyz;

	vec3 offOrg = ( orgB - orgA );
	vec3 offCur = ( posB - posA );

	float restDist = dot( offOrg, offOrg );
	float curDist = dot( offCur, offCur );

	float diff = restDist / ( curDist + restDist ) - 0.5;

	if ( diff > 0.0 ) diff *= 0.25;
	if ( idx > length ) diff = 0.0;

	posA -= offCur * diff * 0.52;

	gl_FragColor = vec4( posA, 1.0 );

}
`;

var integrate_frag = /* glsl */`
precision highp float;


uniform float dt;
uniform vec2 tSize;

uniform sampler2D tOriginal;
uniform sampler2D tPrevious;
uniform sampler2D tPosition;

void main() {

	float dt2 = dt * dt;

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec3 org = texture2D( tOriginal, uv ).xyz;
	vec3 prv = texture2D( tPrevious, uv ).xyz;
	vec3 pos = texture2D( tPosition, uv ).xyz;

	vec3 offset = ( org - pos ) * 20.5 * dt2 * 8.33333;
	vec3 disp = ( pos - prv ) * 0.91 + pos;

	gl_FragColor = vec4( disp + offset, 1.0 );

}
`;

var mouse_frag = /* glsl */`
precision highp float;

uniform float psel;
uniform vec2 tSize;
uniform vec3 mouse;
uniform sampler2D tPosition;
uniform sampler2D tOriginal;

vec2 getUV( float id ) {

	float div = id / tSize.x;
	float d = floor( div );

	float y = d / tSize.x;
	float x = div - d;

	float off = 0.5 / tSize.x;

	return vec2( x + off, y + off );

}

void main() {

	vec3 diff, proj;

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	vec3 pos = texture2D( tPosition, uv ).xyz;
	vec3 org = texture2D( tOriginal, uv ).xyz;

	uv = getUV( psel );
	vec3 ref = texture2D( tOriginal, uv ).xyz;

	vec3 offset = mouse - ref;

	if ( distance( org, ref ) <= 10.0 )  {

		diff = ref - org;

		proj = dot( diff, offset ) / dot( offset, offset ) * org;

		pos = org + proj + offset;

	}

	gl_FragColor = vec4( pos, 1.0 );

}
`;

var normals_frag = /* glsl */`
precision highp float;

uniform int reset;
uniform float length;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tNormal;
uniform sampler2D tFace;

vec2 getUV( float id ) {

	float div = id / tSize.x;
	float d = floor( div );

	float y = d / tSize.x;
	float x = div - d;

	float off = 0.5 / tSize.x;

	return vec2( x + off, y + off );

}

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	vec3 a = texture2D( tPosition, uv ).xyz;

	vec2 uvB, uvC;
	vec3 fNormal, b, c;

	vec3 normal = ( reset == 1 ) ? vec3( 0.0 ) : texture2D( tNormal, uv ).xyz;

	float idx;

	vec2 bColor = texture2D( tFace, uv ).xy;
	idx = bColor.r * 255.0 + bColor.g * 255.0 * 256.0;
	uvB = getUV( idx );

	vec2 cColor = texture2D( tFace, uv ).zw;
	idx = cColor.r * 255.0 + cColor.g * 255.0 * 256.0;
	uvC = getUV( idx );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idx <= length ) normal += fNormal;

	gl_FragColor = vec4( normal, 1.0 );

}
`;

var through_frag = /* glsl */`
precision highp float;

uniform vec2 tSize;
uniform sampler2D texture;

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	gl_FragColor = texture2D( texture, uv );

}
`;

// shader-import-block

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
	length: { value: null },
	tSize: { type: 'v2' },
	tOriginal: { type: 't' },
	tPosition: { type: 't' },
	tConstraints: { type: 't' }
};

const normalsShader = copyShader.clone();
normalsShader.fragmentShader = normals_frag;
normalsShader.uniforms = {
	reset: { value: null },
	length: { value: null },
	tSize: { type: 'v2' },
	tPosition: { type: 't' },
	tNormal: { type: 't' },
	tFace: { type: 't' },
};

let
RESOLUTION,
renderer, mesh, targetRT, ntargetRT, normalsRT,
originalRT, previousRT, positionRT,
constraintsRT, facesRT,
steps = 50;


// setup
const
tSize = new THREE.Vector2(),
scene = new THREE.Scene(),
camera$1 = new THREE.Camera(),
clock = new THREE.Clock();

function init$2( WebGLRenderer ) {

	// setup
	renderer = WebGLRenderer;

	RESOLUTION = Math.ceil( Math.sqrt( vertices.length ) );
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
	renderer.render( scene, camera$1 );

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
	const length = vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		data[ i4 + 0 ] = vertices[ i ].x;
		data[ i4 + 1 ] = vertices[ i ].y;
		data[ i4 + 2 ] = vertices[ i ].z;

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
	const length = vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		for ( let j = 0; j < 2; j++ ) {

			let idx = colors[ i ][ k + j ];

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
	const length = vertices.length;

	for ( let i = 0; i < length; i++ ) {

		const i4 = i * 4;

		const face = faces[ i ][ k ];

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
	renderer.render( scene, camera$1 );

	const tmp = previousRT;
	previousRT = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function solveConstraints( offset ) {

	const tID = ~ ~ ( offset / 2 );
	const cID = offset % 2;

	mesh.material = constraintsShader;
	constraintsShader.uniforms.length.value = vertices.length;
	constraintsShader.uniforms.tSize.value = tSize;
	constraintsShader.uniforms.cID.value = cID;
	constraintsShader.uniforms.tOriginal.value = originalRT.texture;
	constraintsShader.uniforms.tPosition.value = positionRT.texture;
	constraintsShader.uniforms.tConstraints.value = constraintsRT[tID].texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera$1 );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function mouseOffset() {

	mesh.material = mouseShader;
	mouseShader.uniforms.tSize.value = tSize;
	mouseShader.uniforms.psel.value = psel;
	mouseShader.uniforms.mouse.value = mouse3d;
	mouseShader.uniforms.tOriginal.value = originalRT.texture;
	mouseShader.uniforms.tPosition.value = positionRT.texture;

	renderer.setRenderTarget( targetRT );
	renderer.render( scene, camera$1 );

	const tmp = positionRT;
	positionRT = targetRT;
	targetRT = tmp;

}

function computeVertexNormals( id ) {

	mesh.material = normalsShader;
	normalsShader.uniforms.reset.value = ( id == 0 ) ? 1.0 : 0.0;
	normalsShader.uniforms.length.value = vertices.length;
	normalsShader.uniforms.tSize.value = tSize;
	normalsShader.uniforms.tPosition.value = positionRT.texture;
	normalsShader.uniforms.tNormal.value = normalsRT.texture;
	normalsShader.uniforms.tFace.value = facesRT[id].texture;

	renderer.setRenderTarget( ntargetRT );
	renderer.render( scene, camera$1 );

	const tmp = normalsRT;
	normalsRT = ntargetRT;
	ntargetRT = tmp;

}

function update() {

	integrate();

	let mouseUpdating = updating();

	for ( let i = 0; i < steps; i++ ) {

		if ( mouseUpdating && (i+5) < steps ) mouseOffset();

		for ( let j = 0; j < 8; j++ ) {

			solveConstraints( j );

		}

	}

	for ( let i = 0; i < 6; i++ ) {

		computeVertexNormals( i );

	}

}

let
RESOLUTION$1,
mesh$1;

function init$3( scene ) {

	RESOLUTION$1 = Math.ceil( Math.sqrt( vertices.length ) );

	const tl = new THREE.TextureLoader();

	const bmp = tl.load( './src/textures/bmpMap.png' );

	const material = new THREE.MeshPhysicalMaterial( {

		color: 0xffda20,
		bumpMap: bmp,
		bumpScale: 0.25,
		metalness: 0.1,
		roughness: 0.6,
		clearcoat: 0.8,
		clearcoatRoughness: 0.35,
		sheen: new THREE.Color( 0.2, 0.2, 1 ).multiplyScalar( 1 / 6 ),
		dithering: true

	} );

	material.onBeforeCompile = function ( shader ) {
		shader.uniforms.tPosition = { value: positionRT.texture };
		shader.uniforms.tNormal = { value: normalsRT.texture };
		shader.vertexShader = 'uniform sampler2D tPosition;\nuniform sampler2D tNormal;\n' + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <beginnormal_vertex>',
			`vec3 transformed = texture2D( tPosition, position.xy ).xyz;
			 vec3 objectNormal = normalize( texture2D( tNormal, position.xy ).xyz );
			`
		);
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			''
		);
	};

	const depthMaterial = new THREE.MeshDepthMaterial();
	depthMaterial.onBeforeCompile = function ( shader ) {
		shader.uniforms.tPosition = { value: positionRT.texture };
		shader.vertexShader = 'uniform sampler2D tPosition;\n' + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			`vec3 transformed = texture2D( tPosition, position.xy ).xyz;`
		);
	};


	const position = new Float32Array( RESOLUTION$1 * RESOLUTION$1 * 3 );
	for ( let i = 0, il = RESOLUTION$1 * RESOLUTION$1; i < il; i ++ ) {

		const i3 = i * 3;
		position[ i3 + 0 ] = ( i % ( RESOLUTION$1 ) ) / ( RESOLUTION$1 ) + 0.5 / ( RESOLUTION$1 );
		position[ i3 + 1 ] = ~ ~ ( i / ( RESOLUTION$1 ) ) / ( RESOLUTION$1 ) + 0.5 / ( RESOLUTION$1 );

	}

	const geometry$1 = new THREE.BufferGeometry();
	geometry$1.setIndex( geometry.index );
	geometry$1.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );
	geometry$1.addAttribute( 'uv', geometry.attributes.uv );

	mesh$1 = new THREE.Mesh( geometry$1, material );
	mesh$1.customDepthMaterial = depthMaterial;
	mesh$1.castShadow = true;

	scene.add( mesh$1 );

}

let
objects;

const
clock$1 = new THREE.Clock();

function init$4( scene ) {

	// lights
	const ambientLight = new THREE.AmbientLight( 0xffffff, 0 );
	ambientLight.baseIntensity = 0.5;

	const spotLight = new THREE.SpotLight( 0xfd8b8b, 0, 4000, Math.PI/6, 0.2, 0.11 );
	spotLight.baseIntensity = 3.6;
	spotLight.position.set( 0.9, 0.1, -0.5 ).multiplyScalar( 400 );
	spotLight.castShadow = true;
	spotLight.shadow.radius = 20;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.mapSize.height = 4096;
	spotLight.shadow.mapSize.width = 4096;

	const spotLight2 = new THREE.SpotLight( 0x4a7fe8, 0, 4000, Math.PI/6, 0.2, 0.11 );
	spotLight2.baseIntensity = 2.0;
	spotLight2.position.set( -0.91, 0.1, -0.5 ).multiplyScalar( 400 );
	spotLight2.castShadow = true;
	spotLight2.shadow.radius = 20;
	spotLight2.shadow.camera.far = 4000;
	spotLight2.shadow.mapSize.height = 4096;
	spotLight2.shadow.mapSize.width = 4096;

	const spotLight3 = new THREE.SpotLight( 0xffffff, 0, 4000, Math.PI/5.5, 1.4, 0.08 );
	spotLight3.baseIntensity = 1.5;
	spotLight3.position.set( 0, 0, -1 ).multiplyScalar( 400 );
	spotLight3.castShadow = true;
	spotLight3.shadow.radius = 5;
	spotLight3.shadow.camera.far = 4000;
	spotLight3.shadow.mapSize.height = 4096;
	spotLight3.shadow.mapSize.width = 4096;

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 0 );
	directionalLight.baseIntensity = 0.3;
	directionalLight.position.set( 0, 1, +0.5 );
	const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0 );
	directionalLight2.baseIntensity = 1.3;
	directionalLight2.position.set( 0, 1, -0.4 );

	scene.add( ambientLight, spotLight, spotLight2, spotLight3, directionalLight, directionalLight2 );
	objects = [ ambientLight, spotLight, spotLight2, spotLight3, directionalLight, directionalLight2 ];

}

function update$1( ) {

	function easing( t, c ) {
		if ((t/=1/2) < 1) return c/2*t*t*t;
		return c/2*((t-=2)*t*t + 2);
	}

	const time = clock$1.getElapsedTime();

	if ( time > 1 && time < 4 ) {

		for ( let i = 0; i < objects.length; i++ ) {

			objects[i].intensity =  objects[i].baseIntensity * easing( ( time - 1 ) / 3, 1.0 );

		}

	}

}

let
renderer$1, camera$2, scene$1;

function init$5() {

	// renderer
	renderer$1 = new THREE.WebGLRenderer( { antialias: true } );
	renderer$1.setSize( window.innerWidth, window.innerHeight );
	renderer$1.setPixelRatio( window.devicePixelRatio );

	renderer$1.gammaOutput = true;
	renderer$1.physicallyCorrectLights = true;

	renderer$1.shadowMap.enabled = true;
	renderer$1.shadowMap.type = THREE.PCFShadowMap;

	document.body.appendChild( renderer$1.domElement );

	// scene
	scene$1 = new THREE.Scene();
	scene$1.background = new THREE.Color( 0x121312 );

	// camera
	camera$2 = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
	camera$2.position.z = -350;
	camera$2.position.y = -50;
	camera$2.position.x = 0;
	camera$2.lookAt( new THREE.Vector3() );

	// pre-calculate geometry information
	calculate();

	// initialization block;
	init( scene$1 );
	init$4( scene$1 );
	init$3( scene$1 );

	init$1( camera$2, renderer$1.domElement );
	init$2( renderer$1 );

	// release mem for GC
	dispose();

	// start program
	animate();

}

function animate() {

	requestAnimationFrame( animate );

	update$1();
	update();

	renderer$1.setRenderTarget( null );
	renderer$1.render( scene$1, camera$2 );

}

window.onresize = function() {

	const w = window.innerWidth;
	const h = window.innerHeight;

	camera$2.aspect = w / h;
	camera$2.updateProjectionMatrix();

	renderer$1.setSize( w, h );

};

init$5();
