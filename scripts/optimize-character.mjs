// Optimises the TFG character exported from Blender for the web viewer.
//
// Usage (the tools are not project dependencies; install them without saving):
//   npm install --no-save @gltf-transform/core @gltf-transform/extensions \
//     @gltf-transform/functions meshoptimizer sharp
//   node scripts/optimize-character.mjs <source.glb> public/models/character.glb [error] [animations]
//
// `error` is the global simplification tolerance (default 0.0005; 0 disables it).
// `animations` is a comma-separated list of clips to keep (default: the idle, walk,
// sneak and the two attacks used by the viewer).
// Kept clips are made to play in place (root motion removed).
import { statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, resample, weld, simplify, simplifyPrimitive, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const DEFAULT_CLIPS = 'Stay_Idle_Retarget,Walking_Hurt,Crouched_Sneaking,Slash_Basico,Slack_Complejo';
const [, , input, output, errArg = '0.0005', keepArg = DEFAULT_CLIPS] = process.argv;
const KEEP = new Set(keepArg.split(',').filter(Boolean));
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const root = doc.getRoot();

// 1. Animations: keep only the requested clips. Disposing an animation alone
// leaves its samplers holding the keyframe accessors, so dispose those too;
// prune() later removes the orphaned accessors.
for (const anim of root.listAnimations()) {
  if (KEEP.has(anim.getName())) continue;
  for (const sampler of anim.listSamplers()) sampler.dispose();
  for (const channel of anim.listChannels()) channel.dispose();
  anim.dispose();
}
const missing = [...KEEP].filter((name) => !root.listAnimations().some((a) => a.getName() === name));
if (missing.length) throw new Error(`Animations not found: ${missing.join(', ')}`);

// Most of the rig's 412 bones are Rigify controls (MCH, ORG, IK, VIS…) that never
// move a vertex. Keep only the tracks of bones that do: joints with weight on
// some vertex, the nodes rigid parts hang from (mask, hair, katana), and all
// their ancestors. The rest of the tracks are dropped.
{
  const needed = new Set();
  const addWithAncestors = (node) => {
    for (let n = node; n && !needed.has(n); n = n.getParentNode()) needed.add(n);
  };
  for (const node of root.listNodes()) {
    if (!node.getMesh()) continue;
    addWithAncestors(node);
    const skin = node.getSkin();
    if (!skin) continue;
    const joints = skin.listJoints();
    for (const prim of node.getMesh().listPrimitives()) {
      const ids = prim.getAttribute('JOINTS_0');
      const weights = prim.getAttribute('WEIGHTS_0');
      if (!ids || !weights) continue;
      for (let i = 0; i < ids.getCount(); i++) {
        const j = ids.getElement(i, []);
        const w = weights.getElement(i, []);
        for (let k = 0; k < 4; k++) if (w[k] > 0) addWithAncestors(joints[j[k]]);
      }
    }
  }
  let dropped = 0;
  for (const anim of root.listAnimations()) {
    for (const channel of anim.listChannels()) {
      if (needed.has(channel.getTargetNode())) continue;
      channel.getSampler()?.dispose();
      channel.dispose();
      dropped++;
    }
  }
  console.log(`animation tracks: kept bones ${needed.size}, dropped ${dropped} tracks`);
}

// In place (like baking root motion into the pose in Unity). In clips that
// travel, the rig's root-level bones (hips, torso, IK targets) all move forward
// together. The hips' forward progress, frame by frame, is subtracted from each
// of them along its own travel direction, so the body stays put while feet and
// hands keep their motion relative to the hips (steps, lunges). Sideways sway
// and vertical bob are untouched; children of those bones only carry local motion.
const HIPS = 'DEF-spine';
const ROOT_MOTION_THRESHOLD = 0.5;

const track = (channel) => {
  const sampler = channel.getSampler();
  if (sampler.getInterpolation() === 'CUBICSPLINE') throw new Error('CUBICSPLINE tracks are not supported');
  const times = sampler.getInput();
  const values = sampler.getOutput();
  const t = Array.from({ length: times.getCount() }, (_, i) => times.getElement(i, [])[0]);
  const v = Array.from({ length: values.getCount() }, (_, i) => values.getElement(i, []));
  const drift = v[0].map((x, k) => v[v.length - 1][k] - x);
  return { sampler, t, v, drift, length: Math.hypot(...drift) };
};

// Linear interpolation of a sampled curve at time `time`.
const sampleAt = (t, y, time) => {
  if (time <= t[0]) return y[0];
  for (let i = 1; i < t.length; i++) {
    if (time <= t[i]) return y[i - 1] + ((y[i] - y[i - 1]) * (time - t[i - 1])) / (t[i] - t[i - 1]);
  }
  return y[y.length - 1];
};

for (const anim of root.listAnimations()) {
  const translations = anim.listChannels().filter((c) => c.getTargetPath() === 'translation');
  const hipsChannel = translations.find((c) => c.getTargetNode()?.getName() === HIPS);
  if (!hipsChannel) continue;
  const hips = track(hipsChannel);
  if (hips.length < ROOT_MOTION_THRESHOLD) continue; // the clip does not travel
  const dir = hips.drift.map((x) => x / hips.length);
  const progress = hips.v.map((p) => p.reduce((sum, x, k) => sum + (x - hips.v[0][k]) * dir[k], 0));

  for (const channel of translations) {
    const { sampler, t, v, drift, length } = track(channel);
    if (length < ROOT_MOTION_THRESHOLD) continue;
    const own = drift.map((x) => x / length);
    const scale = length / hips.length;
    // Tracks may share their time accessor: write to a copy of the output only.
    const out = sampler.getOutput().clone();
    sampler.setOutput(out);
    v.forEach((p, i) => {
      const travelled = sampleAt(hips.t, progress, t[i]) * scale;
      out.setElement(i, p.map((x, k) => x - travelled * own[k]));
    });
  }
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
// resample() drops keyframes that linear interpolation already reproduces.
await doc.transform(resample(), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
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
