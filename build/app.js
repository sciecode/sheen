(function () {
	'use strict';

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

	float id;

	if ( cID == 0 )
		id = texture2D( tConstraints, uv )[0];
	if ( cID == 1 )
		id = texture2D( tConstraints, uv )[1];
	if ( cID == 2 )
		id = texture2D( tConstraints, uv )[2];
	if ( cID == 3 )
		id = texture2D( tConstraints, uv )[3];

	uv = getUV( id );

	vec3 orgB = texture2D( tOriginal, uv ).xyz;
	vec3 posB = texture2D( tPosition, uv ).xyz;

	vec3 offOrg = ( orgB - orgA );
	vec3 offCur = ( posB - posA );

	float restDist = dot( offOrg, offOrg );
	float curDist = dot( offCur, offCur );

	float diff = restDist / ( curDist + restDist ) - 0.5;

	if ( diff > 0.0 ) diff *= 0.2;
	if ( id == -1.0 ) diff = 0.0;

	posA -= offCur * diff * 0.52;

	gl_FragColor = vec4( posA, 1.0 );

}
`;

	var integrate_frag = /* glsl */`
precision highp float;

uniform vec2 tSize;
uniform sampler2D tOriginal;
uniform sampler2D tPrevious;
uniform sampler2D tPosition;

void main() {

	float dt2 = 0.000256;

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec3 org = texture2D( tOriginal, uv ).xyz;
	vec3 prv = texture2D( tPrevious, uv ).xyz;
	vec3 pos = texture2D( tPosition, uv ).xyz;

	vec3 offset = ( org - pos ) * 28.5 * dt2 * 8.33333;
	vec3 disp = ( pos - prv ) * 0.91 + pos;

	gl_FragColor = vec4( disp + offset, 1.0 );

}
`;

	var mouse_frag = /* glsl */`
precision highp float;

uniform int psel;
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

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	vec3 pos = texture2D( tPosition, uv ).xyz;
	vec3 org = texture2D( tOriginal, uv ).xyz;

	uv = getUV( float( psel ) );
	vec3 ref = texture2D( tOriginal, uv ).xyz;

	vec3 offset = mouse - ref;

	if ( distance( org, ref ) <= 15.0 )  {

		pos = org + offset;

	}

	gl_FragColor = vec4( pos, 1.0 );

}
`;

	var normals_frag = /* glsl */`
precision highp float;

uniform int cID;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tFace1;
uniform sampler2D tFace2;
uniform sampler2D tFace3;

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
	vec3 normals, fNormal, b, c;

	float idB, idC;

	// face0

	idB = texture2D( tFace1, uv ).x;
	idC = texture2D( tFace1, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != -1.0 ) normals += fNormal;

	// face1

	idB = texture2D( tFace1, uv ).z;
	idC = texture2D( tFace1, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face2

	idB = texture2D( tFace2, uv ).x;
	idC = texture2D( tFace2, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face3

	idB = texture2D( tFace2, uv ).z;
	idC = texture2D( tFace2, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face4

	idB = texture2D( tFace3, uv ).x;
	idC = texture2D( tFace3, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face5

	idB = texture2D( tFace3, uv ).z;
	idC = texture2D( tFace3, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	gl_FragColor = vec4( normals, 1.0 );

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


	let RESOLUTION, MOUSE,
		renderer, mesh, steps = 60,
		originalRT, previousRT, positionRT,
		targetRT, normalsRT,
		constraintsRT, facesRT;

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
				tOriginal: { type: 't' },
				tPosition: { type: 't' },
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
		} ),

		normalsShader = new THREE.RawShaderMaterial( {
			uniforms: {
				tSize: { type: 'v2', value: tSize },
				tPosition: { type: 't' },
				tFace1: { type: 't' },
				tFace2: { type: 't' },
				tFace3: { type: 't' },
			},
			vertexShader: through_vert,
			fragmentShader: normals_frag,
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
		} ),


		targetRT = originalRT.clone();
		previousRT = originalRT.clone();
		positionRT = originalRT.clone();
		normalsRT = originalRT.clone();

		constraintsRT = new Array(2);
		constraintsRT[0] = originalRT.clone();
		constraintsRT[1] = originalRT.clone();

		facesRT = new Array(2);
		facesRT[0] = originalRT.clone();
		facesRT[1] = originalRT.clone();
		facesRT[2] = originalRT.clone();

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
		copyShader.uniforms.texture.value = input.texture;

		renderer.setRenderTarget( output );
		renderer.render( scene, camera );

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
		constraintsShader.uniforms.tConstraints.value = constraintsRT[tID].texture;

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
		mouseShader.uniforms.tPosition.value = positionRT.texture;

		renderer.setRenderTarget( targetRT );
		renderer.render( scene, camera );

		const tmp = positionRT;
		positionRT = targetRT;
		targetRT = tmp;

	}

	function computeVertexNormals() {

		mesh.material = normalsShader;
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

	let RESOLUTION$1,
		mesh$1;

	function init$1( geo ) {

		RESOLUTION$1 = Math.ceil( Math.sqrt( geo.attributes.position.count ) );

		const material = new THREE.MeshPhysicalMaterial( {

			color: 0xffda20,
			metalness: 0.1,
			roughness: 0.5,
			clearCoat: 0.8,
			clearCoatRoughness: 0.3,
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

		const geometry = new THREE.BufferGeometry();
		geometry.setIndex( geo.index );
		geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );

		mesh$1 = new THREE.Mesh( geometry, material );
		mesh$1.customDepthMaterial = depthMaterial;
		mesh$1.castShadow = true;

	}

	let 
	camera$1, particles,
	interacting = false,
	psel = undefined;

	const
	mouse = new THREE.Vector2(),
	tmpmouse = new THREE.Vector3(),
	mouse3d = new THREE.Vector3(),
	raycaster = new THREE.Raycaster(),
	plane = new THREE.Plane( undefined, -180 ),
	sphere = new THREE.Sphere( undefined, 100 );


	function init$2( verts, cam ) {

		particles = verts;
		camera$1 = cam;

	}

	function updating() {

		if ( ! interacting ) return;

		raycaster.setFromCamera( mouse, camera$1 );

		if ( raycaster.ray.intersectSphere( sphere, tmpmouse ) != null ) {

			mouse3d.copy( tmpmouse );

			if ( psel == undefined ) {

				let dist = Infinity;
				for ( let i = 0; i < particles.length; i++ ) {

					const tmp = mouse3d.distanceTo( particles[i].original );

					if ( tmp < dist ) {

						dist = tmp;
						psel = i;

					}

				}

			}

		}

		plane.normal.copy( camera$1.position ).normalize();

		if ( raycaster.ray.intersectPlane( plane, tmpmouse ) != null ) {

			mouse3d.copy( tmpmouse );

		}

		return ( interacting && psel ) ? true : false;

	}

	window.onmousemove = function(evt) {

		mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
		mouse.y = -(evt.pageY / window.innerHeight) * 2 + 1;

	};

	window.onmousedown = function(evt) {

		if (evt.button == 0) {

			interacting = true;

		}

	};

	window.onmouseup = function(evt) {

		if ( evt.button == 0 ) {

			interacting = false;
			psel = undefined;

		}

	};

	var MOUSE$1 = /*#__PURE__*/Object.freeze({
		init: init$2,
		updating: updating,
		mouse3d: mouse3d,
		get psel () { return psel; }
	});

	let 
	renderer$1, camera$2, scene$1,
	lights,
	position,
	clock = new THREE.Clock();

	const
	particles$1 = [],
	constraints = [],
	v0 = new THREE.Vector3();

	function init$3() {

		// core
		renderer$1 = new THREE.WebGLRenderer( { antialias: true } );
		renderer$1.setSize( window.innerWidth, window.innerHeight );
		renderer$1.setPixelRatio( window.devicePixelRatio );

		renderer$1.gammaOutput = true;
		renderer$1.physicallyCorrectLights = true;

		renderer$1.shadowMap.enabled = true;
		renderer$1.shadowMap.type = THREE.PCFShadowMap;

		document.body.appendChild( renderer$1.domElement );

		scene$1 = new THREE.Scene();
		renderer$1.setClearColor( 0x121312 );

		camera$2 = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
		camera$2.position.z = -350;
		camera$2.position.y = -50;
		camera$2.position.x = 0;

		camera$2.lookAt( new THREE.Vector3() );

		// lights
		const light = new THREE.AmbientLight( 0x455045, 0 );
		scene$1.add( light );

		const spotLight = new THREE.SpotLight( 0xfd8b8b, 0, 4000, Math.PI/6, 0.2, 0.11 );
		spotLight.position.set( 0.9, 0.1, -0.5 ).multiplyScalar( 400 );
		spotLight.castShadow = true;
		spotLight.shadow.radius = 20;
		spotLight.shadow.camera.far = 4000;
		spotLight.shadow.mapSize.height = 4096;
		spotLight.shadow.mapSize.width = 4096;
		scene$1.add( spotLight );

		const spotLight2 = new THREE.SpotLight( 0x6b7af4, 0, 4000, Math.PI/6, 0.2, 0.11 );
		spotLight2.position.set( -0.91, 0.1, -0.5 ).multiplyScalar( 400 );
		spotLight2.castShadow = true;
		spotLight2.shadow.radius = 20;
		spotLight2.shadow.camera.far = 4000;
		spotLight2.shadow.mapSize.height = 4096;
		spotLight2.shadow.mapSize.width = 4096;
		scene$1.add( spotLight2 );

		const spotLight3 = new THREE.SpotLight( 0x858585, 0, 4000, Math.PI/5.5, 1.4, 0.02 );
		spotLight3.position.set( 0, 0, -1 ).multiplyScalar( 400 );
		spotLight3.castShadow = true;
		spotLight3.shadow.radius = 5;
		spotLight3.shadow.camera.far = 4000;
		spotLight3.shadow.mapSize.height = 4096;
		spotLight3.shadow.mapSize.width = 4096;
		scene$1.add( spotLight3 );

		lights = [ light, spotLight, spotLight2, spotLight3 ];

		// scene
		const bgMaterial = new THREE.MeshPhysicalMaterial( {

			color: 0x393939,
			metalness: 0.9,
			roughness: 0.4,
			dithering: true

		} );

		const bgGeometry = new THREE.PlaneBufferGeometry( 16000, 16000 );

		const bg = new THREE.Mesh( bgGeometry, bgMaterial );
		scene$1.add( bg );
		bg.receiveShadow = true;
		bg.rotation.x += Math.PI * 0.9;
		bg.position.set( 0, -100, 2000 );

		const ico = new THREE.IcosahedronBufferGeometry( 100, 5 );
		const geometry = THREE.BufferGeometryUtils.mergeVertices( ico, 1.5 );
		position = geometry.attributes.position;

		createParticles( geometry );

		init$2( particles$1, camera$2 );

		init( renderer$1, position, particles$1, MOUSE$1 );

		init$1( geometry );
		scene$1.add( mesh$1 );

		animate();

	}

	function createParticles( geometry ) {

		const index = geometry.index;

		for ( let i = 0, il = position.count; i < il; i++ ) {

			v0.fromBufferAttribute( position, i );
			particles$1.push( new Particle( v0.x, v0.y, v0.z ) );

		}

		for ( let i = 0, il = index.count / 3; i < il; i++ ) {

			const i3 = i * 3;

			const a = index.getX( i3 + 0 );
			const b = index.getX( i3 + 1 );
			const c = index.getX( i3 + 2 );

			particles$1[ a ].faces.push( [ b, c ] );
			particles$1[ b ].faces.push( [ c, a ] );
			particles$1[ c ].faces.push( [ a, b ] );

			if ( ! particles$1[ b ].adj.includes( a ) ) {

				const dist = particles$1[ a ].original.distanceTo( particles$1[ b ].original );

				particles$1[ a ].adj.push( b );
				particles$1[ b ].adj.push( a );
				constraints.push( [ a, b, dist * dist ] );

			}

			if ( ! particles$1[ c ].adj.includes( a ) ) {

				const dist = particles$1[ a ].original.distanceTo( particles$1[ c ].original );

				particles$1[ a ].adj.push( c );
				particles$1[ c ].adj.push( a );
				constraints.push( [ a, c, dist * dist ] );

			}

			if ( ! particles$1[ c ].adj.includes( b ) ) {

				const dist = particles$1[ b ].original.distanceTo( particles$1[ c ].original );

				particles$1[ b ].adj.push( c );
				particles$1[ c ].adj.push( b );
				constraints.push( [ b, c, dist * dist ] );

			}

		}

		for ( let i = 0, il = constraints.length; i < il; i++ ) {

			const con = constraints[i];

			let k = 1;
			while ( true ) {

				while ( particles$1[ con[0] ].colors[k] !== undefined ) k++;

				if ( particles$1[ con[1] ].colors[k] === undefined ) {

					con.push( k );
					particles$1[ con[0] ].colors[k] = con[1];
					particles$1[ con[1] ].colors[k] = con[0];
					break;

				} else {

					k++;

				}

			}

		}

	}

	function updateLights() {

		function easing( t, c ) {
		if ((t/=1/2) < 1) return c/2*t*t*t;
		return c/2*((t-=2)*t*t + 2);
	}

		const time = clock.getElapsedTime();

		if ( time > 1 && time < 4 ) {

			for ( let i = 0; i < lights.length; i++ ) {

				lights[i].intensity = easing( ( time - 1 ) / 3, 2.6 );

			}

		}


	}

	function animate() {

		const t = requestAnimationFrame( animate );

		updateLights();

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

	init$3();

}());
