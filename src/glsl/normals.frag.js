export default /* glsl */`
precision highp float;
precision highp sampler2D;

uniform vec2 tSize;

uniform sampler2D tPosition0;
uniform sampler2D tPosition1;

uniform sampler2D tAdjacentsA;
uniform sampler2D tAdjacentsB;

// get vec2 tex coordinate from index
vec2 getUV( float id ) { 

	vec2 coords = vec2(
		floor( mod( ( id + 0.5 ), tSize.x ) ),
		floor( ( id + 0.5 ) / tSize.x )
	) + 0.5;

	return coords / tSize;

}

void main () {

    vec3 normal;
	vec2 uv = gl_FragCoord.xy / tSize.xy;

    // indices of adjacent vertices
	vec4 adjacentA = texture2D( tAdjacentsA, uv );
	vec4 adjacentB = texture2D( tAdjacentsB, uv );

    // vertex position
	vec3 p0 = ( texture2D( tPosition0, uv ).xyz + texture2D( tPosition1, uv ).xyz ) / 1024.0;

	// adjacent vertices positions
    vec3 p1 = ( texture2D( tPosition0, getUV( adjacentA.x ) ).xyz + texture2D( tPosition1, getUV( adjacentA.x ) ).xyz ) / 1024.0;
    vec3 p2 = ( texture2D( tPosition0, getUV( adjacentA.y ) ).xyz + texture2D( tPosition1, getUV( adjacentA.y ) ).xyz ) / 1024.0;
    vec3 p3 = ( texture2D( tPosition0, getUV( adjacentA.z ) ).xyz + texture2D( tPosition1, getUV( adjacentA.z ) ).xyz ) / 1024.0;
    vec3 p4 = ( texture2D( tPosition0, getUV( adjacentA.w ) ).xyz + texture2D( tPosition1, getUV( adjacentA.w ) ).xyz ) / 1024.0;
    vec3 p5 = ( texture2D( tPosition0, getUV( adjacentB.x ) ).xyz + texture2D( tPosition1, getUV( adjacentB.x ) ).xyz ) / 1024.0;
    vec3 p6 = ( texture2D( tPosition0, getUV( adjacentB.y ) ).xyz + texture2D( tPosition1, getUV( adjacentB.y ) ).xyz ) / 1024.0;
    
    // compute vertex normal contribution
    normal += cross( p1 - p0, p2 - p0 );
    normal += cross( p2 - p0, p3 - p0 );
    normal += cross( p3 - p0, p4 - p0 );
    normal += cross( p4 - p0, p5 - p0 );

    if ( adjacentB.y > 0.0 ) {

        normal += cross( p5 - p0, p6 - p0 );
        normal += cross( p6 - p0, p1 - p0 );

    } else {

        normal += cross( p5 - p0, p1 - p0 );

    }

    gl_FragColor = vec4( normalize( normal ), 1.0 );
}
`;
