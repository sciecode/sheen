function Particle ( x, y, z, mass ) {

	this.mass = mass;
	this.position = new THREE.Vector3( x, y, z );
	this.previous = new THREE.Vector3( x, y, z );
	this.original = new THREE.Vector3( x, y, z );

	this.adj = [];
	this.distance = 0;

}

Object.assign( Particle.prototype, {

	constructor: Particle,

	integrate: function ( timesq ) {

		const v0 = new THREE.Vector3();
		const v1 = new THREE.Vector3();

		return function integrate( timesq ) {

			v1.subVectors( this.original, this.position ).multiplyScalar( PULL );

			v0.subVectors( this.position, this.previous );
			v0.multiplyScalar( DRAG ).add( this.position );
			v0.add( v1.multiplyScalar( timesq / this.mass ) );

			this.previous.copy( this.position );
			this.position.copy( v0 );

		}

	}()

} );
