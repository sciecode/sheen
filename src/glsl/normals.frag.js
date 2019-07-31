export default /* glsl */`
precision highp float;

uniform int reset;
uniform float length;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tNormal;
uniform sampler2D tFace;

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
	vec3 a = texture2D( tPosition, uv ).xyz;

	vec2 uvB, uvC;
	vec3 fNormal, b, c;

	vec3 normal = ( reset == 1 ) ? vec3( 0.0 ) : texture2D( tNormal, uv ).xyz;

	float idx;

	vec2 bColor = texture2D( tFace, uv ).xy;
	idx = bColor.r * 255.0 + bColor.g * 255.0 * 256.0;
	uvB = getUV( idx );

	vec2 cColor = texture2D( tFace, uv ).zw;
	idx = cColor.r * 255.0 + cColor.g * 255.0 * 256.0;
	uvC = getUV( idx );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idx <= length ) normal += fNormal;

	gl_FragColor = vec4( normal, 1.0 );

}
`;
