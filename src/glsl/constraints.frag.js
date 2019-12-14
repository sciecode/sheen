export default /* glsl */`
precision highp float;
precision highp sampler2D;

uniform vec2 tSize;
uniform float order;
uniform sampler2D tPosition0;
uniform sampler2D tPosition1;

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

// pack float16 position into float32
vec3 packPosition( vec2 uv ) {

	return ( texture2D( tPosition0, uv ).xyz + texture2D( tPosition1, uv ).xyz ) / 1024.0;

}

vec3 unpackPosition( vec3 pos ) {

	pos *= 1024.0;

	return ( order > 0.0 ) ? floor( pos ) : fract( pos );

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
	vec3 p0 = packPosition( uv );

	// adjacent vertices positions
    vec3 p1 = packPosition( getUV( adjacentA.x ) );
    vec3 p2 = packPosition( getUV( adjacentA.y ) );
    vec3 p3 = packPosition( getUV( adjacentA.z ) );
    vec3 p4 = packPosition( getUV( adjacentA.w ) );
    vec3 p5 = packPosition( getUV( adjacentB.x ) );
	vec3 p6 = packPosition( getUV( adjacentB.y ) );
	
	// spring-based displacement
    displacement += getDisplacement( p0, p1, distancesA.x );
    displacement += getDisplacement( p0, p2, distancesA.y );
    displacement += getDisplacement( p0, p3, distancesA.z );
    displacement += getDisplacement( p0, p4, distancesA.w );
    displacement += getDisplacement( p0, p5, distancesB.x );
    displacement += ( adjacentB.y > 0.0 ) ? getDisplacement( p0, p6, distancesB.y ) : vec3( 0 );

	p0 += 0.76 * displacement / ( ( adjacentB.y > 0.0 ) ? 6.0 : 5.0 );

	gl_FragColor = vec4( unpackPosition( p0 ), 1.0 );

}
`;
