import * as PRE from './pre.js';
import * as FBO from './fbo.js';

let
RESOLUTION,
mesh;

function init( scene ) {

	RESOLUTION = Math.ceil( Math.sqrt( PRE.vertices.length ) );

	const material = new THREE.MeshPhysicalMaterial( {

		color: 0xffda20,
		metalness: 0.1,
		roughness: 0.5,
		clearCoat: 0.8,
		clearCoatRoughness: 0.3,
		dithering: true

	} );

	material.onBeforeCompile = function ( shader ) {
		shader.uniforms.tPosition = { value: FBO.positionRT.texture };
		shader.uniforms.tNormal = { value: FBO.normalsRT.texture };
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
		shader.uniforms.tPosition = { value: FBO.positionRT.texture };
		shader.vertexShader = 'uniform sampler2D tPosition;\n' + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			`vec3 transformed = texture2D( tPosition, position.xy ).xyz;`
		);
	};


	const position = new Float32Array( RESOLUTION * RESOLUTION * 3 );
	for ( let i = 0, il = RESOLUTION * RESOLUTION; i < il; i ++ ) {

		const i3 = i * 3;
		position[ i3 + 0 ] = ( i % ( RESOLUTION ) ) / ( RESOLUTION ) + 0.5 / ( RESOLUTION );
		position[ i3 + 1 ] = ~ ~ ( i / ( RESOLUTION ) ) / ( RESOLUTION ) + 0.5 / ( RESOLUTION );

	}

	const geometry = new THREE.BufferGeometry();
	geometry.setIndex( PRE.geometry.index );
	geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );

	mesh = new THREE.Mesh( geometry, material );
	mesh.customDepthMaterial = depthMaterial;
	mesh.castShadow = true;

	scene.add( mesh );

}

export { init, mesh };
