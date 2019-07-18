export default /* glsl */`
precision highp float;

uniform float psel;
uniform vec2 tSize;
uniform vec3 mouse;
uniform sampler2D tPosition;
uniform sampler2D tOriginal;

vec2 getUV( float id ) {

	float div = id / tSize.x;
	float d = floor( div );

	float y = d / tSize.x;
	float x = div - d;

	float off = 0.5 / tSize.x;

	return vec2( x + off, y + off );

}

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	vec3 pos = texture2D( tOriginal, uv ).xyz;

	uv = getUV( psel );
	vec3 ref = texture2D( tOriginal, uv ).xyz;

	vec3 offset = mouse - ref;

	float disp = 1.0;
	if ( distance( pos, ref ) > 15.0 ) disp = 0.0;

	pos += offset * disp;

	gl_FragColor = vec4( pos, 1.0 );

}
`;
