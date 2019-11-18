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
	object.position.set( 0, - 100, 2000 );

	scene.add( object );

}

export { init };
