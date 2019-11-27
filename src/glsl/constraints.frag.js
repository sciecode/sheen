export default /* glsl */`
precision highp float;

uniform vec2 tSize;
uniform sampler2D tPosition;

uniform sampler2D tDistancesA;
uniform sampler2D tDistancesB;

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

// compute offset based on current distance and spring rest distance
vec3 getDisplacement( vec3 point0, vec3 point1, float restDistance ) {

    float curDistance = distance( point0, point1 );
	return 1.5 * ( curDistance - restDistance ) * ( point1 - point0 ) / curDistance;
	
}

void main() {
	
	vec3 displacement;
	vec2 uv = gl_FragCoord.xy / tSize.xy;

	// indices of adjacent vertices
	vec4 adjacentA = texture2D( tAdjacentsA, uv );
	vec4 adjacentB = texture2D( tAdjacentsB, uv );

	// distances of adjacent vertices
	vec4 distancesA = texture2D( tDistancesA, uv );
	vec4 distancesB = texture2D( tDistancesB, uv );

	// vertex position
	vec3 p0 = texture2D( tPosition, uv ).xyz;

	// adjacent vertices positions
    vec3 p1 = texture2D( tPosition, getUV( adjacentA.x ) ).xyz;
    vec3 p2 = texture2D( tPosition, getUV( adjacentA.y ) ).xyz;
    vec3 p3 = texture2D( tPosition, getUV( adjacentA.z ) ).xyz;
    vec3 p4 = texture2D( tPosition, getUV( adjacentA.w ) ).xyz;
    vec3 p5 = texture2D( tPosition, getUV( adjacentB.x ) ).xyz;
	vec3 p6 = texture2D( tPosition, getUV( adjacentB.y ) ).xyz;
	
	// spring-based displacement
    displacement += getDisplacement( p0, p1, distancesA.x );
    displacement += getDisplacement( p0, p2, distancesA.y );
    displacement += getDisplacement( p0, p3, distancesA.z );
    displacement += getDisplacement( p0, p4, distancesA.w );
    displacement += getDisplacement( p0, p5, distancesB.x );
    displacement += ( adjacentB.y > 0.0 ) ? getDisplacement( p0, p6, distancesB.y ) : vec3( 0 );

	p0 += 0.95 * displacement / ( ( adjacentB.y > 0.0 ) ? 6.0 : 5.0 );

	gl_FragColor = vec4( p0, 1.0 );

}
`;
