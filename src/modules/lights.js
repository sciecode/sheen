
let
objects;

const
clock = new THREE.Clock();

function init( scene ) {

	// lights
	const ambientLight = new THREE.AmbientLight( 0xffffff, 0 );
	ambientLight.baseIntensity = 0.5;

	const spotLight = new THREE.SpotLight( 0xfd8b8b, 0, 4000, Math.PI/6, 0.2, 0.11 );
	spotLight.baseIntensity = 3.6;
	spotLight.position.set( 0.9, 0.1, -0.5 ).multiplyScalar( 400 );
	spotLight.castShadow = true;
	spotLight.shadow.radius = 20;
	spotLight.shadow.camera.far = 4000
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

function update( ) {

	function easing( t, c ) {
		if ((t/=1/2) < 1) return c/2*t*t*t;
		return c/2*((t-=2)*t*t + 2);
	}

	const time = clock.getElapsedTime();

	if ( time > 1 && time < 4 ) {

		for ( let i = 0; i < objects.length; i++ ) {

			objects[i].intensity =  objects[i].baseIntensity * easing( ( time - 1 ) / 3, 1.0 );

		}

	}

}

export { init, update };
