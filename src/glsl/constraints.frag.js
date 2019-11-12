export default /* glsl */`
precision highp float;

uniform int cID;
uniform float length;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tOriginal;
uniform sampler2D tConstraints;

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

	vec3 orgA = texture2D( tOriginal, uv ).xyz;
	vec3 posA = texture2D( tPosition, uv ).xyz;

	float idx;
	
	vec2 idxColor = ( cID == 0 ) ? texture2D( tConstraints, uv ).xy : texture2D( tConstraints, uv ).zw;

	idx = idxColor.r * 255.0 + idxColor.g * 255.0 * 256.0;

	uv = getUV( idx );

	vec3 orgB = texture2D( tOriginal, uv ).xyz;
	vec3 posB = texture2D( tPosition, uv ).xyz;

	vec3 offOrg = ( orgB - orgA );
	vec3 offCur = ( posB - posA );

	float restDist = dot( offOrg, offOrg );
	float curDist = dot( offCur, offCur );

	float diff = restDist / ( curDist + restDist ) - 0.5;

	if ( diff > 0.0 ) diff *= 0.25;
	if ( idx > length ) diff = 0.0;

	posA -= offCur * diff * 0.52;

	gl_FragColor = vec4( posA, 1.0 );

}
`;
