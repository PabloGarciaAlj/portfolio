// Prepares the TFG katana exported from Blender for the landing.
//
// Usage (the tools are not project dependencies; install them without saving):
//   npm install --no-save @gltf-transform/core @gltf-transform/extensions \
//     @gltf-transform/functions
//   node scripts/optimize-katana.mjs <source.glb> public/models/katana.glb
//
// Quality first: the low poly mesh (7.5k triangles) is kept exactly as exported,
// with float positions, normals and the MikkTSpace tangents the textures were
// baked with. No simplification and no quantization, which would show up as
// wobbly reflections on the polished blade.
//
// Textures: 2048 px. The atlas gives the blade ~2900 texels along its length at
// 2K, more than the device pixels it covers on the landing even on retina
// screens, so mipmapping would never sample a 4K level there. 4K was tried:
// 17.6 MB instead of 5 MB, ~270 MB of VRAM, and it lost the WebGL context on an
// Intel Iris Xe laptop.
//
// They go to near-lossless WebP (max error 2/255, PSNR ~52 dB). Regular lossy
// WebP subsamples colour, which mixes the independent channels of the normal and
// metallic/roughness maps (errors up to 255 measured), so it is never used here.
import { statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune } from '@gltf-transform/functions';
import sharp from 'sharp';

const SIZE = 2048;
const [, , input, output] = process.argv;
if (!input || !output) throw new Error('Usage: node scripts/optimize-katana.mjs <source.glb> <output.glb>');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const doc = await io.read(input);
const root = doc.getRoot();

// Blender exported the material as BLEND, but the textures have no alpha: opaque
// avoids sorting artefacts and is cheaper. Double sided stays, as in Blender.
for (const material of root.listMaterials()) material.setAlphaMode('OPAQUE');

doc.createExtension(EXTTextureWebP).setRequired(true);
for (const texture of root.listTextures()) {
  const image = await sharp(texture.getImage())
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .toColourspace('srgb') // also turns the 16-bit normal map into 8-bit
    .webp({ nearLossless: true, quality: 60, effort: 6 })
    .toBuffer();
  texture.setImage(image).setMimeType('image/webp').setURI('');
}

await doc.transform(dedup(), prune());
await io.write(output, doc);
console.log(`${output}: ${(statSync(output).size / 1e6).toFixed(2)} MB`);
