
let
geometry, adjacency, vertices;

function mergeVertices( geometry, tolerance = 1e-4 ) {

	tolerance = Math.max( tolerance, Number.EPSILON );

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	const hashToIndex = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute( 'position' );
	const vertexCount = indices ? indices.count : positions.count;

	// next value for triangle indices
	let nextIndex = 0;

	// attributes and new attribute arrays
	const attributeNames = Object.keys( geometry.attributes );
	const tmpAttributes = {};
	const tmpMorphAttributes = {};
	const newIndices = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	// Initialize the arrays, allocating space conservatively. Extra
	// space will be trimmed in the last step.
	for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

		const name = attributeNames[ i ];
		const attr = geometry.attributes[ name ];
		tmpAttributes[ name ] = new THREE.BufferAttribute( new attr.array.constructor( attr.count * attr.itemSize ), attr.itemSize, attr.normalized );
		const morphAttr = geometry.morphAttributes[ name ];
		if ( morphAttr ) {

			tmpMorphAttributes[ name ] = new THREE.BufferAttribute( new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize ), morphAttr.itemSize, morphAttr.normalized );

		}

	}

	// convert the error tolerance to an amount of decimal places to truncate to
	const decimalShift = Math.log10( 1 / tolerance );
	const shiftMultiplier = Math.pow( 10, decimalShift );
	for ( let i = 0; i < vertexCount; i ++ ) {

		const index = indices ? indices.getX( i ) : i;

		// Generate a hash for the vertex attributes at the current index 'i'
		let hash = '';
		for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

			const name = attributeNames[ j ];
			const attribute = geometry.getAttribute( name );
			const itemSize = attribute.itemSize;
			for ( let k = 0; k < itemSize; k ++ ) {

				// double tilde truncates the decimal value
				hash += `${~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier )},`;

			}

		}

		// Add another reference to the vertex if it's already
		// used by another index
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			// copy data to the new index in the temporary attributes
			for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

				const name = attributeNames[ j ];
				const attribute = geometry.getAttribute( name );
				const morphAttr = geometry.morphAttributes[ name ];
				const itemSize = attribute.itemSize;
				const newarray = tmpAttributes[ name ];
				const newMorphArrays = tmpMorphAttributes[ name ];
				for ( let k = 0; k < itemSize; k ++ ) {

					const getterFunc = getters[ k ];
					const setterFunc = setters[ k ];
					newarray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );
					if ( morphAttr ) {

						for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

							newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttr[ m ][ getterFunc ]( index ) );

						}

					}

				}

			}

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// generate result THREE.BufferGeometry
	const result = geometry.clone();
	for ( const name in geometry.attributes ) {

		const tmpAttribute = tmpAttributes[ name ];
		result.setAttribute( name, new THREE.BufferAttribute( tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ), tmpAttribute.itemSize, tmpAttribute.normalized ) );
		if ( ! ( name in tmpMorphAttributes ) ) continue;
		for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

			const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];
			result.morphAttributes[ name ][ j ] = new THREE.BufferAttribute( tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ), tmpMorphAttribute.itemSize, tmpMorphAttribute.normalized );

		}

	}

	// indices

	result.setIndex( newIndices );
	return result;

}

function calculate() {

	const tmp = new THREE.IcosahedronBufferGeometry( 1000, 5 );

	// icosahedron generates non-indexed vertices, we make use of graph adjacency.
	geometry = mergeVertices( tmp, 1.2 ); 

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
