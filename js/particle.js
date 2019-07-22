function Particle ( x, y, z ) {
	this.position = new THREE.Vector3( x, y, z );
	this.original = new THREE.Vector3( x, y, z );

	this.colors = new Array( 20 ).fill( undefined );
	this.adj = [];
	this.faces = [];
	this.distance = 0;

};
