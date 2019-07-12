function Particle ( x, y, z, mass ) {

	this.mass = mass;
	this.position = new THREE.Vector3( x, y, z );
	this.previous = new THREE.Vector3( x, y, z );
	this.original = new THREE.Vector3( x, y, z );

	this.adj = [];
	this.distance = 0;
	this.a = new THREE.Vector3();

}

Object.assign( Particle.prototype, {

	constructor: Particle,

	addForce: function ( force ) {

		this.a.copy( force ).multiplyScalar( 1 / this.mass );

	},

	integrate: function ( timesq ) {

		const v0 = new THREE.Vector3();

		return function integrate( timesq ) {

			v0.subVectors( this.position, this.previous );
			v0.multiplyScalar( DRAG ).add( this.position );
			v0.add( this.a.multiplyScalar( timesq ) );

			this.previous.copy( this.position );
			this.position.copy( v0 );

		}

	}()

} );
