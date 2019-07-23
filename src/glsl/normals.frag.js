export default /* glsl */`
precision highp float;

uniform int cID;

uniform vec2 tSize;

uniform sampler2D tPosition;
uniform sampler2D tFace1;
uniform sampler2D tFace2;
uniform sampler2D tFace3;

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
	vec3 normals, fNormal, b, c;

	float idB, idC;

	// face0

	idB = texture2D( tFace1, uv ).x;
	idC = texture2D( tFace1, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != -1.0 ) normals += fNormal;

	// face1

	idB = texture2D( tFace1, uv ).z;
	idC = texture2D( tFace1, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face2

	idB = texture2D( tFace2, uv ).x;
	idC = texture2D( tFace2, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face3

	idB = texture2D( tFace2, uv ).z;
	idC = texture2D( tFace2, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face4

	idB = texture2D( tFace3, uv ).x;
	idC = texture2D( tFace3, uv ).y;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	// face5

	idB = texture2D( tFace3, uv ).z;
	idC = texture2D( tFace3, uv ).w;

	uvB = getUV( idB );
	uvC = getUV( idC );

	b = texture2D( tPosition, uvB ).xyz;
	c = texture2D( tPosition, uvC ).xyz;

	fNormal = cross( ( c - b ), ( a - b ) );

	if ( idB != - 1.0 ) normals += fNormal;

	gl_FragColor = vec4( normals, 1.0 );

}
`;
