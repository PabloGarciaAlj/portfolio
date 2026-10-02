// Optimises the TFG character exported from Blender for the web viewer.
//
// Usage (the tools are not project dependencies; install them without saving):
//   npm install --no-save @gltf-transform/core @gltf-transform/extensions \
//     @gltf-transform/functions meshoptimizer sharp
//   node scripts/optimize-character.mjs <source.glb> public/models/character.glb [error]
//
// `error` is the global simplification tolerance (default 0.0005; 0 disables it).
import { statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, simplifyPrimitive, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [, , input, output, errArg = '0.0005'] = process.argv;
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const root = doc.getRoot();

// 1. No animations for now.
for (const anim of root.listAnimations()) {
  // Disposing the animation alone leaves its samplers holding the keyframe accessors.
  for (const sampler of anim.listSamplers()) {
    sampler.getInput()?.dispose();
    sampler.getOutput()?.dispose();
    sampler.dispose();
  }
  for (const channel of anim.listChannels()) channel.dispose();
  anim.dispose();
}

// 2. Everything was exported as alpha BLEND, which breaks depth sorting.
const HAIR = /^Pel/;
for (const mat of root.listMaterials()) {
  if (HAIR.test(mat.getName())) {
    mat.setAlphaMode('MASK').setAlphaCutoff(0.5);
  } else {
    // Keep double-sided: some cloth (the hanging kimono) is a plane with no thickness.
    mat.setAlphaMode('OPAQUE');
  }
}

// 3. Geometry. Thin, dense parts (sandal and belt ropes, hair cards) get a
// stronger per-mesh pass; the rest only loses what is not visible.
await doc.transform(dedup(), weld());
const PER_NODE = [
  [/^Cuerdas_[LR]/, { ratio: 0.12, error: 0.02 }],
  [/^Circle.002$/, { ratio: 0.3, error: 0.01 }],
  [/^Pelo/, { ratio: 0.5, error: 0.004 }],
];
for (const node of root.listNodes()) {
  const rule = PER_NODE.find(([re]) => re.test(node.getName()));
  if (!rule || !node.getMesh()) continue;
  for (const prim of node.getMesh().listPrimitives()) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ...rule[1] });
}
await doc.transform(
  simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: Number(errArg) }),
  prune(),
);

// 4. Textures to WebP: base colour of large surfaces at 2K, the rest at 1K,
// metallic/roughness at 512.
doc.createExtension(EXTTextureWebP).setRequired(true);
for (const tex of root.listTextures()) {
  const name = tex.getName();
  const isNormal = /normal/i.test(name);
  const isORM = /Metallic|Roughness/.test(name);
  const isBigBase = !isNormal && !isORM && /Piel|Kimono/.test(name);
  const size = isORM ? 512 : isBigBase ? 2048 : 1024;
  const image = await sharp(Buffer.from(tex.getImage()))
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .toColorspace('srgb')
    .webp({ quality: isNormal ? 92 : 86, alphaQuality: 90 })
    .toBuffer();
  tex.setImage(new Uint8Array(image)).setMimeType('image/webp').setURI(tex.getURI().replace(/\.\w+$/, '.webp'));
}

// 5. Compression.
await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(output, doc);

let tris = 0;
for (const mesh of root.listMeshes()) {
  let t = 0;
  for (const p of mesh.listPrimitives()) t += p.getIndices().getCount() / 3;
  tris += t;
  console.log(mesh.listParents().find((p) => p.propertyType === 'Node')?.getName(), t);
}
let texBytes = 0;
for (const t of root.listTextures()) texBytes += t.getImage().byteLength;
console.log({
  tris,
  textures: root.listTextures().length,
  texMB: (texBytes / 1048576).toFixed(2),
  fileMB: (statSync(output).size / 1048576).toFixed(2),
});
