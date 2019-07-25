export default /* glsl */`
precision highp float;

uniform vec2 tSize;
uniform sampler2D tOriginal;
uniform sampler2D tPrevious;
uniform sampler2D tPosition;

void main() {

	float dt2 = 0.000256;

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec3 org = texture2D( tOriginal, uv ).xyz;
	vec3 prv = texture2D( tPrevious, uv ).xyz;
	vec3 pos = texture2D( tPosition, uv ).xyz;

	vec3 offset = ( org - pos ) * 20.5 * dt2 * 8.33333;
	vec3 disp = ( pos - prv ) * 0.91 + pos;

	gl_FragColor = vec4( disp + offset, 1.0 );

}
`;
