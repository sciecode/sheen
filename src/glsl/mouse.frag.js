export default /* glsl */`
precision highp float;
precision highp sampler2D;

uniform float psel;
uniform vec2 tSize;
uniform vec3 mouse;
uniform float order;
uniform sampler2D tPosition0;
uniform sampler2D tPosition1;
uniform sampler2D tOriginal;

// get vec2 tex coordinate from index
vec2 getUV( float id ) { 

	vec2 coords = vec2(
		floor( mod( ( id + 0.5 ), tSize.x ) ),
		floor( ( id + 0.5 ) / tSize.x )
	) + 0.5;

	return coords / tSize;

}

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec3 pos = ( texture2D( tPosition0, uv ).xyz + texture2D( tPosition1, uv ).xyz ) / 1024.0 ;
	vec3 org = texture2D( tOriginal, uv ).xyz;
	vec3 ref = texture2D( tOriginal, getUV( psel ) ).xyz;

	vec3 diff, proj, offset = mouse - ref;

	if ( distance( org, ref ) <= 0.1 )  {

		diff = ref - org;

		proj = dot( diff, offset ) / dot( offset, offset ) * org;

		pos = org + proj + offset;

	}

	pos *= 1024.0;

	gl_FragColor = vec4( ( order > 0.0 ) ? floor( pos ) : fract( pos ), 1.0 );

}
`;
