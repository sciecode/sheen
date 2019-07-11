function Particle( x, y, z, mass ) {

	this.mass = mass;
	this.position = new THREE.Vector3( x, y, z );
	this.previous = this.position.clone();
	this.original = this.position.clone();

	this.adj = [];
	this.distance = 0;
	this.tmp = new THREE.Vector3();
	this.a = new THREE.Vector3();

}

Particle.prototype.addForce = function ( force ) {

	this.a.copy( this.tmp.copy( force ).multiplyScalar( 1 / this.mass ) );

};

Particle.prototype.integrate = function ( timesq ) {

	this.tmp.subVectors( this.position, this.previous );
	this.tmp.multiplyScalar( DRAG ).add( this.position );
	this.tmp.add( this.a.multiplyScalar( timesq ) );

	this.previous.copy( this.position );
	this.position.copy( this.tmp );

};
