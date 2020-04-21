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
in vec3 vPos;

#define DL_NUMBER 8
#define PL_NUMBER 16
uniform vec3 directionalLight[DL_NUMBER]; //平行光 xyz - 向量位置
uniform vec4 directionalLightColor[DL_NUMBER]; // 平行光颜色, a - 强度
uniform vec3 pointLightPosition[PL_NUMBER]; //点光源位置
uniform vec4 pointLightColor[PL_NUMBER]; // 点光源颜色
uniform vec3 pointLightDecay; // 点光源衰减系数
uniform vec4 ambientColor; // 环境光

vec3 getDiffuse(in vec3 normal) {
  // 多个平行光
  vec3 dl = vec3(0., 0., 0.);
  for(int j = 0; j < DL_NUMBER; j++) {
    vec4 invDirectional = vec4(directionalLight[j], 0.0);
    float _dl = max(dot(normal, normalize(invDirectional.xyz)), 0.0);
    dl += directionalLightColor[j].a * _dl * directionalLightColor[j].rgb;
  }

  // 多个点光源
  vec3 pl = vec3(0., 0., 0.);
  for(int i = 0; i < PL_NUMBER; i++) {
    vec3 invPoint = pointLightPosition[i] - vPos;
    vec3 dir = normalize(invPoint);// 计算点光源入射光线反方向并归一化
    float cos = max(dot(dir, normal), 0.0);
    float dis = length(invPoint);
    float decay = (1.0 / (pointLightDecay.x * pow(dis, 2.0) + pointLightDecay.y * dis + pointLightDecay.z));
    pl += pointLightColor[i].a * cos * pointLightColor[i].rgb;
  }

  return dl + pl;
}

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
  vec3 diffuse = getDiffuse(normal);
  vec3 ambient = ambientColor.rgb * ambientColor.a;// 计算环境光反射颜色

  FragColor = vec4((diffuse + ambient) * color.rgb, color.a);
}