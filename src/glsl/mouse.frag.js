export default /* glsl */`
precision highp float;

uniform float psel;
uniform vec2 tSize;
uniform vec3 mouse;
uniform sampler2D tPosition;
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

	vec3 pos = texture2D( tPosition, uv ).xyz;
	vec3 org = texture2D( tOriginal, uv ).xyz;
	vec3 ref = texture2D( tOriginal, getUV( psel ) ).xyz;

	vec3 diff, proj, offset = mouse - ref;

	if ( distance( org, ref ) <= 10.0 )  {

		diff = ref - org;

		proj = dot( diff, offset ) / dot( offset, offset ) * org;

		pos = org + proj + offset;

	}

	gl_FragColor = vec4( pos, 1.0 );

}
`;
