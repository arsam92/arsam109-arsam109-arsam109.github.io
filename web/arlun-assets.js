const COMPONENT_INFO = {
  5120: { Ctor: Int8Array, size: 1, signed: true, max: 127 },
  5121: { Ctor: Uint8Array, size: 1, signed: false, max: 255 },
  5122: { Ctor: Int16Array, size: 2, signed: true, max: 32767 },
  5123: { Ctor: Uint16Array, size: 2, signed: false, max: 65535 },
  5125: { Ctor: Uint32Array, size: 4, signed: false, max: 4294967295 },
  5126: { Ctor: Float32Array, size: 4, float: true, max: 1 }
};

const TYPE_SIZE = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

function dataUriBytes(uri) {
  const comma = uri.indexOf(",");
  if (comma < 0) throw new Error("Invalid data URI");
  const header = uri.slice(0, comma);
  const body = uri.slice(comma + 1);
  if (header.includes(";base64")) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  return new TextEncoder().encode(decodeURIComponent(body)).buffer;
}

function absoluteUrl(base, value) {
  return new URL(value, base).href;
}

async function loadUri(uri, baseUrl) {
  if (uri.startsWith("data:")) return dataUriBytes(uri);
  const response = await fetch(absoluteUrl(baseUrl, uri));
  if (!response.ok) throw new Error("Asset request failed: " + response.status + " " + uri);
  return response.arrayBuffer();
}

async function parseGLB(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Invalid GLB magic");
  const version = view.getUint32(4, true);
  if (version !== 2) throw new Error("Unsupported GLB version: " + version);

  const length = view.getUint32(8, true);
  let offset = 12;
  let json = null;
  let binary = null;

  while (offset + 8 <= length) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + chunkLength;

    if (chunkType === 0x4e4f534a) {
      const text = new TextDecoder().decode(new Uint8Array(arrayBuffer, start, chunkLength));
      json = JSON.parse(text.replace(/\\s+$/, ""));
    } else if (chunkType === 0x004e4942) {
      binary = arrayBuffer.slice(start, end);
    }
    offset = end;
  }

  if (!json) throw new Error("GLB is missing JSON chunk");
  return { json, buffers: binary ? [binary] : [] };
}

function readAccessor(gltf, buffers, accessorIndex, forceFloat = false) {
  const accessor = gltf.accessors[accessorIndex];
  if (!accessor) throw new Error("Missing accessor " + accessorIndex);
  const viewDef = gltf.bufferViews?.[accessor.bufferView];
  const component = COMPONENT_INFO[accessor.componentType];
  const count = accessor.count;
  const itemSize = TYPE_SIZE[accessor.type];

  if (!component) throw new Error("Unsupported accessor component type");
  if (!viewDef) return new (forceFloat || accessor.normalized ? Float32Array : component.Ctor)(count * itemSize);

  const buffer = buffers[viewDef.buffer];
  const byteOffset = (viewDef.byteOffset || 0) + (accessor.byteOffset || 0);
  const stride = viewDef.byteStride || component.size * itemSize;
  const tightlyPacked = stride === component.size * itemSize;

  if (tightlyPacked && !forceFloat && !accessor.normalized) {
    return new component.Ctor(buffer, byteOffset, count * itemSize);
  }

  const out = new Float32Array(count * itemSize);
  const source = new DataView(buffer);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < itemSize; j++) {
      const at = byteOffset + i * stride + j * component.size;
      let value;
      if (accessor.componentType === 5126) value = source.getFloat32(at, true);
      else if (accessor.componentType === 5125) value = source.getUint32(at, true);
      else if (accessor.componentType === 5123) value = source.getUint16(at, true);
      else if (accessor.componentType === 5121) value = source.getUint8(at);
      else if (accessor.componentType === 5122) value = source.getInt16(at, true);
      else if (accessor.componentType === 5120) value = source.getInt8(at);
      else throw new Error("Unsupported accessor component type");
      out[i * itemSize + j] = accessor.normalized
        ? normalizeComponent(value, accessor.componentType)
        : value;
    }
  }
  return out;
}

function normalizeComponent(value, componentType) {
  if (componentType === 5120) return Math.max(value / 127, -1);
  if (componentType === 5121) return value / 255;
  if (componentType === 5122) return Math.max(value / 32767, -1);
  if (componentType === 5123) return value / 65535;
  if (componentType === 5125) return value / 4294967295;
  return value;
}

function asFloat32(data) {
  if (data instanceof Float32Array) return data;
  return new Float32Array(data);
}

async function loadImageBitmap(source, mimeType, baseUrl) {
  let bytes;
  if (source.uri) bytes = await loadUri(source.uri, baseUrl);
  else if (source.bufferView !== undefined) {
    const viewDef = source.__gltf.bufferViews[source.bufferView];
    const buffer = source.__buffers[viewDef.buffer];
    bytes = buffer.slice(viewDef.byteOffset || 0, (viewDef.byteOffset || 0) + viewDef.byteLength);
  } else {
    throw new Error("Image has no URI or bufferView");
  }

  const blob = new Blob([bytes], { type: mimeType || "image/png" });
  if ("createImageBitmap" in window) {
    return createImageBitmap(blob);
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class Texture2D {
  constructor(gl, image, options = {}) {
    this.gl = gl;
    this.texture = gl.createTexture();
    this.width = image.width;
    this.height = image.height;
    this.name = options.name || "texture";

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8,
      gl.RGBA, gl.UNSIGNED_BYTE, image
    );

    const pot = (n) => (n & (n - 1)) === 0;
    const wrapS = options.wrapS === "REPEAT" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    const wrapT = options.wrapT === "REPEAT" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

    if (pot(this.width) && pot(this.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  destroy() {
    this.gl.deleteTexture(this.texture);
  }
}

export class Material {
  constructor(options = {}) {
    this.name = options.name || "default";
    this.baseColorFactor = options.baseColorFactor || [1, 1, 1, 1];
    this.metallic = options.metallic ?? 0.0;
    this.roughness = options.roughness ?? 0.75;
    this.baseColorTexture = options.baseColorTexture || null;
    this.doubleSided = !!options.doubleSided;
  }
}

export class GPUMesh {
  constructor(gl, primitive, material = new Material()) {
    this.gl = gl;
    this.material = material;
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();
    this.indexType = null;
    this.count = primitive.indices.length;

    const hasUV = primitive.uvs.length > 0;
    const interleaved = new Float32Array(primitive.positions.length / 3 * 11);

    for (let i = 0; i < primitive.positions.length / 3; i++) {
      interleaved[i * 11 + 0] = primitive.positions[i * 3 + 0];
      interleaved[i * 11 + 1] = primitive.positions[i * 3 + 1];
      interleaved[i * 11 + 2] = primitive.positions[i * 3 + 2];
      interleaved[i * 11 + 3] = primitive.normals[i * 3 + 0] ?? 0;
      interleaved[i * 11 + 4] = primitive.normals[i * 3 + 1] ?? 1;
      interleaved[i * 11 + 5] = primitive.normals[i * 3 + 2] ?? 0;
      interleaved[i * 11 + 6] = primitive.uvs[i * 2 + 0] ?? 0;
      interleaved[i * 11 + 7] = primitive.uvs[i * 2 + 1] ?? 0;
      interleaved[i * 11 + 8] = primitive.colors[i * 4 + 0] ?? 1;
      interleaved[i * 11 + 9] = primitive.colors[i * 4 + 1] ?? 1;
      interleaved[i * 11 + 10] = primitive.colors[i * 4 + 2] ?? 1;
    }

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);

    const indexArray = primitive.indices;
    const maxIndex = indexArray.reduce((m, v) => Math.max(m, v), 0);
    if (maxIndex > 65535) {
      this.indexType = gl.UNSIGNED_INT;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexArray), gl.STATIC_DRAW);
    } else {
      this.indexType = gl.UNSIGNED_SHORT;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
    }

    const stride = 11 * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 32);
    gl.bindVertexArray(null);
  }

  draw() {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.count, this.indexType, 0);
  }

  destroy() {
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.vbo);
    this.gl.deleteBuffer(this.ebo);
    this.material.baseColorTexture?.destroy();
  }
}

export async function loadGLTF(gl, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Model request failed: " + response.status);
  const baseUrl = new URL(".", new URL(url, window.location.href)).href;
  const isGLB = url.toLowerCase().split("?")[0].endsWith(".glb");

  let gltf;
  let buffers;

  if (isGLB) {
    const parsed = await parseGLB(await response.arrayBuffer());
    gltf = parsed.json;
    buffers = parsed.buffers;
  } else {
    gltf = await response.json();
    buffers = [];
    for (const buffer of gltf.buffers || []) {
      if (!buffer.uri) throw new Error("External .gltf buffers must define a URI");
      buffers.push(await loadUri(buffer.uri, baseUrl));
    }
  }

  const textures = [];
  for (let i = 0; i < (gltf.images || []).length; i++) {
    const imageDef = { ...gltf.images[i], __gltf: gltf, __buffers: buffers };
    const textureDef = (gltf.textures || []).find(t => t.source === i);
    const sampler = textureDef?.sampler !== undefined ? gltf.samplers[textureDef.sampler] : null;
    const bitmap = await loadImageBitmap(imageDef, imageDef.mimeType, baseUrl);
    textures[i] = new Texture2D(gl, bitmap, {
      name: "gltf-image-" + i,
      wrapS: sampler?.wrapS === 10497 ? "REPEAT" : "CLAMP",
      wrapT: sampler?.wrapT === 10497 ? "REPEAT" : "CLAMP"
    });
    bitmap.close?.();
  }

  const materials = (gltf.materials || []).map((m, index) => {
    const pbr = m.pbrMetallicRoughness || {};
    let texture = null;
    if (pbr.baseColorTexture) texture = textures[gltf.textures?.[pbr.baseColorTexture.index]?.source];
    return new Material({
      name: m.name || "material-" + index,
      baseColorFactor: pbr.baseColorFactor || [1,1,1,1],
      metallic: pbr.metallicFactor ?? 0,
      roughness: pbr.roughnessFactor ?? 0.75,
      baseColorTexture: texture,
      doubleSided: !!m.doubleSided
    });
  });
  if (!materials.length) materials.push(new Material());

  const meshes = [];
  for (const meshDef of gltf.meshes || []) {
    for (const primitiveDef of meshDef.primitives || []) {
      if ((primitiveDef.mode ?? 4) !== 4) continue;
      const pos = asFloat32(readAccessor(gltf, buffers, primitiveDef.attributes.POSITION));
      const normal = primitiveDef.attributes.NORMAL !== undefined
        ? asFloat32(readAccessor(gltf, buffers, primitiveDef.attributes.NORMAL))
        : new Float32Array(pos.length);
      const uv = primitiveDef.attributes.TEXCOORD_0 !== undefined
        ? asFloat32(readAccessor(gltf, buffers, primitiveDef.attributes.TEXCOORD_0))
        : new Float32Array((pos.length / 3) * 2);
      let color = new Float32Array((pos.length / 3) * 4).fill(1);
      if (primitiveDef.attributes.COLOR_0 !== undefined) {
        const colorAccessorIndex = primitiveDef.attributes.COLOR_0;
        const colorAccessor = gltf.accessors[colorAccessorIndex];
        const rawColor = readAccessor(gltf, buffers, colorAccessorIndex, true);
        const colorSize = TYPE_SIZE[colorAccessor.type];
        for (let i = 0; i < colorAccessor.count; i++) {
          color[i * 4] = rawColor[i * colorSize] ?? 1;
          color[i * 4 + 1] = rawColor[i * colorSize + 1] ?? 1;
          color[i * 4 + 2] = rawColor[i * colorSize + 2] ?? 1;
          color[i * 4 + 3] = rawColor[i * colorSize + 3] ?? 1;
        }
      }
      const indices = primitiveDef.indices !== undefined
        ? Array.from(readAccessor(gltf, buffers, primitiveDef.indices))
        : Array.from({ length: pos.length / 3 }, (_, i) => i);

      if (normal.every(v => v === 0)) {
        generateFlatNormals(pos, normal, indices);
      }
      const material = materials[primitiveDef.material ?? 0] || materials[0];
      meshes.push({
        name: meshDef.name || "mesh-" + meshes.length,
        gpu: new GPUMesh(gl, { positions: pos, normals: normal, uvs: uv, colors: color, indices }, material),
        material
      });
    }
  }

  return {
    meshes,
    materials,
    destroy() {
      meshes.forEach(m => m.gpu.destroy());
      const unique = [...new Set(textures)];
      unique.forEach(t => t.destroy());
    }
  };
}

function generateFlatNormals(positions, normals, indices) {
  normals.fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3, ib = indices[i+1] * 3, ic = indices[i+2] * 3;
    const ax = positions[ib]-positions[ia], ay = positions[ib+1]-positions[ia+1], az = positions[ib+2]-positions[ia+2];
    const bx = positions[ic]-positions[ia], by = positions[ic+1]-positions[ia+1], bz = positions[ic+2]-positions[ia+2];
    const nx = ay*bz-az*by, ny = az*bx-ax*bz, nz = ax*by-ay*bx;
    for (const idx of [ia,ib,ic]) {
      normals[idx]+=nx; normals[idx+1]+=ny; normals[idx+2]+=nz;
    }
  }
  for (let i=0; i<normals.length; i+=3) {
    const l=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;
    normals[i]/=l; normals[i+1]/=l; normals[i+2]/=l;
  }
}

export function createTexturedCubeImage(gl) {
  const canvas = document.createElement("canvas");
  canvas.width = 2; canvas.height = 2;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1d4ed8"; ctx.fillRect(0,0,1,1);
  ctx.fillStyle = "#f97316"; ctx.fillRect(1,0,1,1);
  ctx.fillStyle = "#22c55e"; ctx.fillRect(0,1,1,1);
  ctx.fillStyle = "#eab308"; ctx.fillRect(1,1,1,1);
  return new Texture2D(gl, canvas, { name: "runtime-checker" });
}
