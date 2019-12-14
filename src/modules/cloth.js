import * as PRE from './pre.js';
import * as FBO from './fbo.js';

let
RESOLUTION,
mesh;

function init( scene ) {

	RESOLUTION = Math.ceil( Math.sqrt( PRE.vertices.length ) );

	const bmp = new THREE.TextureLoader().load( './src/textures/bmpMap.png' );
	bmp.wrapS = THREE.RepeatWrapping;
	bmp.wrapT = THREE.RepeatWrapping;
	bmp.repeat.set( 2.5, 2.5 );

	const material = new THREE.MeshPhysicalMaterial( {

		color: 0xffda20,
		bumpMap: bmp,
		bumpScale: 0.012,
		metalness: 0.1,
		roughness: 0.6,
		clearcoat: 0.8,
		clearcoatRoughness: 0.35,
		sheen: new THREE.Color( 0.2, 0.2, 1 ).multiplyScalar( 1 / 6 ),
		dithering: true

	} );

	// update cloth material with computed position and normals
	material.onBeforeCompile = function ( shader ) {
		shader.uniforms.tPosition0 = { value: FBO.positionRT[ 0 ].texture };
		shader.uniforms.tPosition1 = { value: FBO.positionRT[ 1 ].texture };
		shader.uniforms.tNormal = { value: FBO.normalsRT.texture };
		shader.vertexShader = 'precision highp sampler2D;\nuniform sampler2D tPosition0;\nuniform sampler2D tPosition1;\nuniform sampler2D tNormal;\n' + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <beginnormal_vertex>',
			`vec3 transformed = ( texture2D( tPosition0, position.xy ).xyz + texture2D( tPosition1, position.xy ).xyz ) / 1024.0;
			 vec3 objectNormal = normalize( texture2D( tNormal, position.xy ).xyz );
			`
		);
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			''
		);
	};

	// update depth material for correct shadows
	const depthMaterial = new THREE.MeshDepthMaterial();
	depthMaterial.onBeforeCompile = function ( shader ) {
		shader.uniforms.tPosition0 = { value: FBO.positionRT[ 0 ].texture };
		shader.uniforms.tPosition1 = { value: FBO.positionRT[ 1 ].texture };
		shader.vertexShader = 'precision highp sampler2D;\nuniform sampler2D tPosition0;\nuniform sampler2D tPosition1;\n' + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			`vec3 transformed = ( texture2D( tPosition0, position.xy ).xyz + texture2D( tPosition1, position.xy ).xyz ) / 1024.0;`
		);
	};

	// fill position with associated texture sampling coordinate
	const position = new Float32Array( RESOLUTION * RESOLUTION * 3 );
	for ( let i = 0, il = RESOLUTION * RESOLUTION; i < il; i ++ ) {

		const i3 = i * 3;
		position[ i3 + 0 ] = ( i % ( RESOLUTION ) ) / ( RESOLUTION ) + 0.5 / ( RESOLUTION );
		position[ i3 + 1 ] = ~ ~ ( i / ( RESOLUTION ) ) / ( RESOLUTION ) + 0.5 / ( RESOLUTION );

	}

	const geometry = new THREE.BufferGeometry();
	geometry.setIndex( PRE.geometry.index );
	geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );
	geometry.addAttribute( 'uv', PRE.geometry.attributes.uv );

	mesh = new THREE.Mesh( geometry, material );
	mesh.customDepthMaterial = depthMaterial;
	mesh.castShadow = true;

	scene.add( mesh );

}

export { init, mesh };
