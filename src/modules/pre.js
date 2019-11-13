
let
geometry,
faces, colors,
vertices = new Array(),
constraints = new Array();

function calculate( ) {

	const tmp = new THREE.IcosahedronBufferGeometry( 100, 5 );

	// icosahedron generates non-indexed vertices, we make use of graph adjacency.
	geometry = THREE.BufferGeometryUtils.mergeVertices( tmp, 1.5 ); 

	populateVertices();

	faces = Array.from( { length: vertices.length }, () => new Array() );

	// I know 8 is sufficient in this case, but it might not be if you are re-utilizing this code.
	colors = Array.from( { length: vertices.length }, () => new Array( 8 ).fill() );

	populateConstraints();

	populateColors();

}

function populateVertices( ) {

	const v0 = new THREE.Vector3();
	const position = geometry.attributes.position;

	for ( let i = 0, il = position.count; i < il; i++ ) {

		v0.fromBufferAttribute( position, i );
		vertices.push( v0.clone() );

	}

}

function populateConstraints( ) {

	const index = geometry.index;
	const adjacency = Array.from( { length: vertices.length }, () => new Array() );

	for ( let i = 0, il = index.count / 3; i < il; i++ ) {

		const i3 = i * 3;

		const a = index.getX( i3 + 0 );
		const b = index.getX( i3 + 1 );
		const c = index.getX( i3 + 2 );

		faces[a].push( [ b, c ] );
		faces[b].push( [ c, a ] );
		faces[c].push( [ a, b ] );

		if ( ! adjacency[b].includes( a ) ) {

			adjacency[a].push( b );
			adjacency[b].push( a );
			constraints.push( [ a, b ] );

		}

		if ( ! adjacency[c].includes( a ) ) {

			adjacency[a].push( c );
			adjacency[c].push( a );
			constraints.push( [ a, c ] );

		}

		if ( ! adjacency[c].includes( b ) ) {

			adjacency[b].push( c );
			adjacency[c].push( b );
			constraints.push( [ b, c ] );

		}

	}

}

function populateColors( ) {

	// naive edge-coloring implementation, should be optimized.
	// works decently well for this case, but definitely the bottleneck of this method.
	// improving this is well worth it.
	for ( let i = 0, il = constraints.length; i < il; i++ ) {

		const con = constraints[i];

		let k = 0;
		while ( true ) {

			while ( colors[ con[0] ][k] !== undefined ) k++;

			if ( colors[ con[1] ][k] === undefined ) {

				colors[ con[0] ][k] = con[1];
				colors[ con[1] ][k] = con[0];
				break;

			} else {

				k++;

			}

		}

	}

}

function dispose( ) {

	faces = undefined;
	colors = undefined;
	constraints = undefined;

}

export { calculate, dispose, geometry, vertices, faces, colors };
