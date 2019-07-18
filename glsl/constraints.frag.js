export default /* glsl */`
precision highp float;

uniform int cID;

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

	float id;

	if ( cID == 0 )
		id = texture2D( tConstraints, uv )[0];
	if ( cID == 1 )
		id = texture2D( tConstraints, uv )[1];
	if ( cID == 2 )
		id = texture2D( tConstraints, uv )[2];
	if ( cID == 3 )
		id = texture2D( tConstraints, uv )[3];

	uv = getUV( id );

	vec3 orgB = texture2D( tOriginal, uv ).xyz;
	vec3 posB = texture2D( tPosition, uv ).xyz;

	vec3 offOrg = ( orgB - orgA );
	vec3 offCur = ( posB - posA );

	float restDist = dot( offOrg, offOrg );
	float curDist = dot( offCur, offCur );

	float diff = restDist / ( curDist + restDist ) - 0.5;

	if ( id == -1.0 ) diff = 0.0;

	posA -= offCur * diff * 0.76;

	gl_FragColor = vec4( posA, 1.0 );

}
`;
