export default /* glsl */`
precision highp float;

uniform vec2 tSize;
uniform sampler2D texture;

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;
	gl_FragColor = texture2D( texture, uv );

}
`;
