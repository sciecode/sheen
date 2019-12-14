export default /* glsl */`
precision highp float;
precision highp sampler2D;

uniform vec2 tSize;
uniform float order;
uniform sampler2D texture;

void main() {

	vec2 uv = gl_FragCoord.xy / tSize.xy;

	vec4 img = texture2D( texture, uv ) * 1024.0;
	gl_FragColor = ( order > 0.0 ) ? floor( img ) : fract( img );

}
`;
