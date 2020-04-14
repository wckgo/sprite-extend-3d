#version 300 es
precision highp float;
precision highp int;

uniform mat4 viewMatrix;
uniform sampler2D tMap;

#ifdef FLAG_BUMP
uniform sampler2D tBump;
#endif

uniform sampler2D tNormal;
uniform float uNormalScale;
uniform float uNormalUVScale;

in vec2 vUv;
in vec3 vNormal;
in vec3 vMPos;
in vec4 vColor;
in vec3 vLDir;

uniform vec4 directionalLight; //平行光
uniform vec4 pointLightColor; // 点光源颜色
uniform vec4 ambientColor; // 环境光

out vec4 FragColor;

vec3 getNormal(float depth) {
  vec3 pos_dx = dFdx(vMPos.xyz);
  vec3 pos_dy = dFdy(vMPos.xyz);
  vec2 tex_dx = dFdx(vUv);
  vec2 tex_dy = dFdy(vUv);

  vec3 t = normalize(pos_dx * tex_dy.t - pos_dy * tex_dx.t);
  vec3 b = normalize(-pos_dx * tex_dy.s + pos_dy * tex_dx.s);
  mat3 tbn = mat3(t, b, normalize(vNormal));

  vec3 n = texture(tNormal, vUv * uNormalUVScale).rgb * 2.0 - 1.0;
  n.xy *= depth * uNormalScale;
  vec3 normal = normalize(tbn * n);

  // Get world normal from view normal
  return normalize((vec4(normal, 0.0) * viewMatrix).xyz);
}

void main() {
  vec4 color = vColor;
  vec4 texColor = texture(tMap, vUv);

  float alpha = texColor.a;
  color.rgb = mix(color.rgb, texColor.rgb, alpha);
  color.rgb = mix(texColor.rgb, color.rgb, clamp(color.a / max(0.0001, texColor.a), 0.0, 1.0));
  color.a = texColor.a + (1.0 - texColor.a) * color.a;

  float depth = 1.0;
#ifdef FLAG_BUMP
  depth = texture(tBump, vUv).x;
#endif
  vec3 normal = getNormal(depth);

  vec3 dir = vLDir;
  float cos = max(dot(dir, normal), 0.0);// 计算入射角余弦值

  vec3 light = normalize(directionalLight.xyz);
  float shading = dot(normal, light) * directionalLight.w;
  vec3 diffuse = pointLightColor.rgb * color.rgb * pointLightColor.a * cos;// 计算点光源漫反射颜色
  vec3 ambient = ambientColor.rgb * color.rgb;// 计算环境光反射颜色
  color = vec4(diffuse + ambient, color.a);
  
  FragColor.rgb = color.rgb + shading;
  FragColor.a = color.a;
}