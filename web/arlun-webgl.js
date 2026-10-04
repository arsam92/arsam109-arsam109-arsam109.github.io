import {
  GPUMesh,
  Material,
  loadGLTF,
  createTexturedCubeImage
} from "./arlun-assets.js";

const canvas = document.querySelector("#game");
const status = document.querySelector("#status");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  alpha: false,
  depth: true
});

if (!gl) {
  status.textContent = "WebGL2 is not supported by this browser.";
  throw new Error("ARlun Web Runtime requires WebGL2");
}

const vertexSource = [
  "#version 300 es",
  "precision highp float;",
  "layout(location=0) in vec3 aPosition;",
  "layout(location=1) in vec3 aNormal;",
  "layout(location=2) in vec2 aUV;",
  "layout(location=3) in vec3 aColor;",
  "uniform mat4 uModel;",
  "uniform mat4 uView;",
  "uniform mat4 uProjection;",
  "uniform mat3 uNormalMatrix;",
  "out vec3 vNormal;",
  "out vec3 vWorldPosition;",
  "out vec2 vUV;",
  "out vec3 vColor;",
  "void main(){",
  "  vec4 world=uModel*vec4(aPosition,1.0);",
  "  vWorldPosition=world.xyz;",
  "  vNormal=normalize(uNormalMatrix*aNormal);",
  "  vUV=aUV;",
  "  vColor=aColor;",
  "  gl_Position=uProjection*uView*world;",
  "}"
].join("\n");

const fragmentSource = [
  "#version 300 es",
  "precision highp float;",
  "in vec3 vNormal;",
  "in vec3 vWorldPosition;",
  "in vec2 vUV;",
  "in vec3 vColor;",
  "uniform vec3 uCameraPosition;",
  "uniform vec3 uLightDirection;",
  "uniform vec3 uLightColor;",
  "uniform vec3 uAmbientColor;",
  "uniform float uLightIntensity;",
  "uniform vec4 uBaseColorFactor;",
  "uniform float uMetallic;",
  "uniform float uRoughness;",
  "uniform bool uHasTexture;",
  "uniform sampler2D uBaseColorTexture;",
  "out vec4 outColor;",
  "void main(){",
  "  vec4 texel=uHasTexture ? texture(uBaseColorTexture,vUV) : vec4(1.0);",
  "  vec3 albedo=texel.rgb*uBaseColorFactor.rgb*vColor;",
  "  float alpha=texel.a*uBaseColorFactor.a;",
  "  vec3 N=normalize(vNormal);",
  "  vec3 L=normalize(-uLightDirection);",
  "  vec3 V=normalize(uCameraPosition-vWorldPosition);",
  "  vec3 H=normalize(L+V);",
  "  float diffuse=max(dot(N,L),0.0);",
  "  float rough=max(uRoughness,0.04);",
  "  float shininess=mix(8.0,128.0,1.0-rough);",
  "  float specular=pow(max(dot(N,H),0.0),shininess);",
  "  float specStrength=mix(0.04,0.35,1.0-uMetallic);",
  "  vec3 lighting=uAmbientColor+(diffuse*uLightColor*uLightIntensity);",
  "  vec3 color=albedo*lighting+(specular*specStrength*uLightColor);",
  "  float fog=clamp(exp(-0.018*length(uCameraPosition-vWorldPosition)),0.0,1.0);",
  "  vec3 fogColor=vec3(0.035,0.045,0.065);",
  "  outColor=vec4(mix(fogColor,color,fog),alpha);",
  "}"
].join("\n");

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(vsSource, fsSource) {
  const program = gl.createProgram();
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "program link failed";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

const program = createProgram(vertexSource, fragmentSource);
const loc = {
  model: gl.getUniformLocation(program, "uModel"),
  view: gl.getUniformLocation(program, "uView"),
  projection: gl.getUniformLocation(program, "uProjection"),
  normal: gl.getUniformLocation(program, "uNormalMatrix"),
  camera: gl.getUniformLocation(program, "uCameraPosition"),
  lightDirection: gl.getUniformLocation(program, "uLightDirection"),
  lightColor: gl.getUniformLocation(program, "uLightColor"),
  ambientColor: gl.getUniformLocation(program, "uAmbientColor"),
  lightIntensity: gl.getUniformLocation(program, "uLightIntensity"),
  baseColorFactor: gl.getUniformLocation(program, "uBaseColorFactor"),
  metallic: gl.getUniformLocation(program, "uMetallic"),
  roughness: gl.getUniformLocation(program, "uRoughness"),
  hasTexture: gl.getUniformLocation(program, "uHasTexture"),
  baseColorTexture: gl.getUniformLocation(program, "uBaseColorTexture")
};

function v3(x=0,y=0,z=0){ return [x,y,z]; }
function add(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function mul(a,s){ return [a[0]*s,a[1]*s,a[2]*s]; }
function len(a){ return Math.hypot(a[0],a[1],a[2]); }
function norm(a){ const l=len(a)||1; return [a[0]/l,a[1]/l,a[2]/l]; }
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }

function identity(){
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}
function multiply(a,b){
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
function translation(x,y,z){ const m=identity(); m[12]=x; m[13]=y; m[14]=z; return m; }
function scaling(x,y,z){ const m=identity(); m[0]=x; m[5]=y; m[10]=z; return m; }
function rotationX(r){
  const c=Math.cos(r),s=Math.sin(r);
  return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);
}
function rotationY(r){
  const c=Math.cos(r),s=Math.sin(r);
  return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);
}
function perspective(fov,aspect,near,far){
  const f=1/Math.tan(fov/2), nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
function lookAt(eye,target,up=[0,1,0]){
  const z=norm([eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]]);
  const x=norm(cross(up,z));
  const y=cross(z,x);
  return new Float32Array([
    x[0],y[0],z[0],0,
    x[1],y[1],z[1],0,
    x[2],y[2],z[2],0,
    -x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],
    -y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],
    -z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1
  ]);
}

function normalMatrix(m){
  const a=m[0], b=m[4], c=m[8], d=m[1], e=m[5], f=m[9], g=m[2], h=m[6], i=m[10];
  const A=e*i-f*h, B=f*g-d*i, C=d*h-e*g;
  const D=c*h-b*i, E=a*i-c*g, F=b*g-a*h;
  const G=b*f-c*e, H=c*d-a*f, I=a*e-b*d;
  const det=a*A+b*B+c*C || 1;
  return new Float32Array([A/det,D/det,G/det,B/det,E/det,H/det,C/det,F/det,I/det]);
}

function cubePrimitive(){
  const faces=[
    {n:[0,0,1],c:[1,.25,.25],p:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},
    {n:[0,0,-1],c:[.25,.55,1],p:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]},
    {n:[1,0,0],c:[.25,1,.5],p:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]},
    {n:[-1,0,0],c:[1,.75,.2],p:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]},
    {n:[0,1,0],c:[.6,.3,1],p:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]},
    {n:[0,-1,0],c:[.2,.9,.9],p:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]}
  ];
  const positions=[],normals=[],uvs=[],colors=[],indices=[];
  faces.forEach((f,i)=>{
    const base=i*4;
    f.p.forEach((p,j)=>{
      positions.push(...p);
      normals.push(...f.n);
      uvs.push(j===1||j===2?1:0,j>=2?1:0);
      colors.push(...f.c);
    });
    indices.push(base,base+1,base+2,base,base+2,base+3);
  });
  return {positions,normals,uvs,colors,indices};
}

function planePrimitive(size=18){
  const h=size/2;
  return {
    positions:[-h,0,-h,h,0,-h,h,0,h,-h,0,h],
    normals:[0,1,0,0,1,0,0,1,0,0,1,0],
    uvs:[0,0,6,0,6,6,0,6],
    colors:[.32,.36,.42,.32,.36,.42,.32,.36,.42,.32,.36,.42],
    indices:[0,1,2,0,2,3]
  };
}

const checkerTexture=createTexturedCubeImage(gl);
const demoMaterial=new Material({
  name:"ARlun Demo Material",
  baseColorFactor:[1,1,1,1],
  metallic:.15,
  roughness:.42,
  baseColorTexture:checkerTexture
});
const floorMaterial=new Material({
  name:"ARlun Ground",
  baseColorFactor:[.55,.6,.7,1],
  metallic:0,
  roughness:.92
});

const cube=new GPUMesh(gl,cubePrimitive(),demoMaterial);
const plane=new GPUMesh(gl,planePrimitive(),floorMaterial);

let importedScene=null;
let importedStatus="no external model loaded";

async function tryLoadDemoGLTF(){
  try{
    importedScene=await loadGLTF(gl,"assets/scene.gltf");
    importedStatus=importedScene.instances.length
      ? "GLTF loaded: "+importedScene.instances.length+" scene instance(s)"
      : "GLTF loaded but contains no visible mesh instance";
  }catch(error){
    console.warn("ARlun asset loader:", error);
    importedScene=null;
    importedStatus="No external model loaded — procedural demo active";
  }
}
tryLoadDemoGLTF();

const camera={
  position:v3(0,2.2,7),
  yaw:0,
  pitch:-0.12,
  velocityY:0,
  grounded:true
};

const keys=new Set();
let pointerLocked=false;

addEventListener("keydown",e=>{
  keys.add(e.code);
  if(e.code==="KeyR"){
    camera.position=v3(0,2.2,7);
    camera.yaw=0;
    camera.pitch=-0.12;
    camera.velocityY=0;
  }
});
addEventListener("keyup",e=>keys.delete(e.code));

canvas.addEventListener("click",()=>canvas.requestPointerLock?.());
document.addEventListener("pointerlockchange",()=>{
  pointerLocked=document.pointerLockElement===canvas;
});
document.addEventListener("mousemove",e=>{
  if(!pointerLocked) return;
  camera.yaw-=e.movementX*.0025;
  camera.pitch-=e.movementY*.0025;
  camera.pitch=Math.max(-1.45,Math.min(1.45,camera.pitch));
});

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.clearColor(.035,.045,.065,1);

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  const w=Math.max(1,Math.floor(innerWidth*dpr));
  const h=Math.max(1,Math.floor(innerHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h);
  }
}
addEventListener("resize",resize);

function update(dt){
  const forward=[Math.sin(camera.yaw),0,Math.cos(camera.yaw)];
  const right=[Math.cos(camera.yaw),0,-Math.sin(camera.yaw)];
  let move=v3();
  if(keys.has("KeyW")) move=add(move,forward);
  if(keys.has("KeyS")) move=add(move,mul(forward,-1));
  if(keys.has("KeyD")) move=add(move,right);
  if(keys.has("KeyA")) move=add(move,mul(right,-1));
  if(len(move)>0) move=norm(move);
  camera.position=add(camera.position,mul(move,dt*4.5));
  if(keys.has("Space")&&camera.grounded){
    camera.velocityY=6;
    camera.grounded=false;
  }
  camera.velocityY-=14.5*dt;
  camera.position[1]+=camera.velocityY*dt;
  if(camera.position[1]<=1.35){
    camera.position[1]=1.35;
    camera.velocityY=0;
    camera.grounded=true;
  }
}

function drawMesh(mesh,model){
  const material=mesh.material || floorMaterial;
  if(material.doubleSided) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);

  gl.uniformMatrix4fv(loc.model,false,model);
  gl.uniformMatrix3fv(loc.normal,false,normalMatrix(model));
  gl.uniform4fv(loc.baseColorFactor,material.baseColorFactor);
  gl.uniform1f(loc.metallic,material.metallic);
  gl.uniform1f(loc.roughness,material.roughness);
  gl.uniform1i(loc.hasTexture,material.baseColorTexture ? 1 : 0);
  if(material.baseColorTexture){
    material.baseColorTexture.bind(0);
    gl.uniform1i(loc.baseColorTexture,0);
  }
  mesh.draw();
}

function drawImported(now){
  if(!importedScene?.instances?.length) return false;
  importedScene.instances.forEach((instance)=>{
    const model=multiply(instance.matrix, rotationY(now*.25));
    drawMesh(instance.mesh.gpu,model);
  });
  return true;
}

function render(time){
  resize();
  const now=time*.001;
  render.last ??= now;
  const dt=Math.min(.05,now-render.last);
  render.last=now;
  update(dt);

  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  const direction=[
    Math.sin(camera.yaw)*Math.cos(camera.pitch),
    Math.sin(camera.pitch),
    Math.cos(camera.yaw)*Math.cos(camera.pitch)
  ];
  gl.uniformMatrix4fv(loc.view,false,lookAt(camera.position,add(camera.position,direction)));
  gl.uniformMatrix4fv(loc.projection,false,perspective(Math.PI/3,canvas.width/canvas.height,.1,100));
  gl.uniform3fv(loc.camera,camera.position);
  gl.uniform3fv(loc.lightDirection,[-.4,-1,-.35]);
  gl.uniform3fv(loc.lightColor,[1,.92,.8]);
  gl.uniform3fv(loc.ambientColor,[.12,.14,.18]);
  gl.uniform1f(loc.lightIntensity,1.8);

  drawMesh(plane,identity());

  if(!drawImported(now)){
    drawMesh(cube,multiply(translation(-2,1.35,-1.5),rotationY(now*.7)));
    drawMesh(cube,multiply(translation(1.8,1.35,-2.4),multiply(rotationX(Math.sin(now)*.15),rotationY(-now*.56))));
    drawMesh(cube,multiply(translation(0,1.35,-5),multiply(rotationY(now*.4),scaling(1.5,1.5,1.5))));
  }

  status.textContent="WebGL2 · ARlun Renderer · "+importedStatus+
    " · WASD / mouse / Space / R";
  requestAnimationFrame(render);
}

status.textContent="WebGL2 · ARlun Renderer · loading assets…";
requestAnimationFrame(render);
