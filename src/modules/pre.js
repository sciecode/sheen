
let
geometry, adjacency, vertices;

function calculate() {

	const tmp = new THREE.IcosahedronBufferGeometry( 1000, 5 );

	// icosahedron generates non-indexed vertices, we make use of graph adjacency.
	geometry = THREE.BufferGeometryUtils.mergeVertices( tmp, 1.2 ); 

	geometry.scale( 0.00095, 0.00095, 0.00095 );

	populateVertices();

	populateAdjacency();

}

function populateVertices() {

	const v0 = new THREE.Vector3();
	const position = geometry.attributes.position;

	vertices = new Array();

	for ( let i = 0, il = position.count; i < il; i++ ) {

		v0.fromBufferAttribute( position, i );
		vertices.push( v0.clone() );

	}

}

function populateAdjacency() {

	const 
	index = geometry.index,
	faces = Array.from( { length: vertices.length }, () => new Array() );

	// compute all faces for set vertex
	for ( let i = 0, il = index.count / 3; i < il; i++ ) {

		const 
		i3 = i * 3,
		a = index.getX( i3 + 0 ),
		b = index.getX( i3 + 1 ),
		c = index.getX( i3 + 2 ),

		face = new THREE.Face3( a, b, c );

		faces[ a ].push( face );
		faces[ b ].push( face );
		faces[ c ].push( face );

	}

	// support function - find face with winding order ( first ) -> ( next )
	function getFace( arr, first, next ) {

		for ( let r = 0; r < arr.length; r++ ) {
			
			var n = arr[ r ];

			if ( n.a === first && n.b === next ||
				 n.b === first && n.c === next ||
				 n.c === first && n.a === next )
				return n
		}
	
		console.error( "sheen.error: shouldn't reach here." );
		return 
	
	}

	adjacency = Array.from( { length: vertices.length }, () => new Array() );

	// compute sorted adjacency list for every vertex
	for ( let r = 0; r < faces.length; r++ ) {

		let n = faces[ r ][ 0 ];

		// cycle in a fan, through all faces of the vertex
		while ( true ) { 

			if ( n.a == r ) {

				adjacency[ r ].push( n.c );
				n = getFace( faces[ r ], r, n.c ); // face with reverse winding order ( a ) -> ( c )

			} else if ( n.b == r ) {
				
				adjacency[ r ].push( n.a );
				n = getFace( faces[ r ], r, n.a ); // face with reverse winding order ( b ) -> ( a )

			} else { // n.c == r

				adjacency[ r ].push( n.b );
				n = getFace( faces[ r ], r, n.b ); // face with reverse winding order ( c ) -> ( b )

			}

			// back to the start - end
			if ( n == faces[ r ][ 0 ] ) break;

		}

	}

}

function dispose() {

	geometry = undefined;
	adjacency = undefined;

}

export { calculate, dispose, geometry, vertices, adjacency };
