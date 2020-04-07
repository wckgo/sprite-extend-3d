precision highp float;
precision highp int;

varying vec3 vNormal;
varying vec3 vDir;
varying vec4 vColor;

uniform samplerCube tMap;

varying float fCos;
varying float fShading;

uniform vec4 pointLightColor; // 点光源颜色
uniform vec4 ambientColor; // 环境光

void main() {
  vec4 color = vColor;
  vec4 texColor = textureCube(tMap, vDir);

  float alpha = texColor.a;
  color.rgb = mix(color.rgb, texColor.rgb, alpha);
  color.rgb = mix(texColor.rgb, color.rgb, clamp(color.a / max(0.0001, texColor.a), 0.0, 1.0));
  color.a = texColor.a + (1.0 - texColor.a) * color.a;

  vec3 diffuse = pointLightColor.rgb * color.rgb * pointLightColor.a * fCos;// 计算点光源漫反射颜色
  vec3 ambient = ambientColor.rgb * color.rgb;// 计算环境光反射颜色

  color = vec4(diffuse + ambient, color.a);

  gl_FragColor.rgb = color.rgb + fShading;
  gl_FragColor.a = color.a;
}