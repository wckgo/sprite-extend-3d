precision highp float;
precision highp int;

varying vec3 vNormal;
varying vec4 vColor;

uniform sampler2D tShadow;
uniform float uShadow;
uniform mat4 viewMatrix;

varying vec4 vLightNDC;
varying vec4 vPos;

#define DL_NUMBER 8
#define PL_NUMBER 16
uniform vec3 directionalLight[DL_NUMBER]; //平行光 xyz - 向量位置
uniform vec4 directionalLightColor[DL_NUMBER]; // 平行光颜色, a - 强度
uniform vec3 pointLightPosition[PL_NUMBER]; //点光源位置
uniform vec4 pointLightColor[PL_NUMBER]; // 点光源颜色
uniform vec3 pointLightDecay; // 点光源衰减系数
uniform vec4 ambientColor; // 环境光

vec3 getDiffuse(in vec4 mv, in vec3 normal) {
  // 多个平行光
  vec3 dl = vec3(0., 0., 0.);
  for(int j = 0; j < DL_NUMBER; j++) {
    vec4 invDirectional = viewMatrix * vec4(directionalLight[j], 0.0);
    float _dl = max(dot(normal, normalize(invDirectional.xyz)), 0.0);
    dl += directionalLightColor[j].a * _dl * directionalLightColor[j].rgb;
  }

  // 多个点光源
  vec3 pl = vec3(0., 0., 0.);
  for(int i = 0; i < PL_NUMBER; i++) {
    vec3 invPoint = (viewMatrix * vec4(pointLightPosition[i], 1.0)).xyz - mv.xyz;
    float cos = max(dot(normalize(invPoint), normal), 0.0);
    float dis = length(invPoint);
    float decay = (1.0 / (pointLightDecay.x * pow(dis, 2.0) + pointLightDecay.y * dis + pointLightDecay.z));
    
    pl += pointLightColor[i].a * cos * decay * pointLightColor[i].rgb;
  }

  return dl + pl;
}

float unpackRGBA (vec4 v) {
    return dot(v, 1.0 / vec4(1.0, 255.0, 65025.0, 16581375.0));
}

void main() {
  vec4 color = vColor;

  vec3 lightPos = vLightNDC.xyz / vLightNDC.w;
  
  float bias = 0.001;
  float depth = lightPos.z - bias;
  float occluder = unpackRGBA(texture2D(tShadow, lightPos.xy));

  // Compare actual depth from light to the occluded depth rendered in the depth map
  // If the occluded depth is smaller, we must be in uShadow
  float uShadowDept = mix(uShadow, 1.0, step(depth, occluder));

  vec3 ambient = ambientColor.rgb * ambientColor.a;// 计算环境光反射颜色

  vec3 diffuse = getDiffuse(vPos, vNormal);
  color = vec4((diffuse + ambient) * color.rgb, color.a);

  gl_FragColor.rgb = color.rgb * uShadowDept;
  gl_FragColor.a = color.a;
}