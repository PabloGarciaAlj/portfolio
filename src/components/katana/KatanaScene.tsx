import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { AgXToneMapping, Box3, Vector3, type Group, type Material, type Mesh, type Object3D } from 'three';
import type { MotionValue } from 'motion/react';
import { poseAt, type Layout, type Pose } from './pose';

// Narrow field of view: close to orthographic, so poses placed in CSS pixels
// land where they are meant to, while turns still show some depth.
const FOV = 18;
// CSS pixels per scene unit.
const PX = 100;

interface Props {
  src: string;
  /** Scroll progress through the section, 0 to 1 (already smoothed). */
  progress: MotionValue<number>;
  /** Kept up to date by the backdrop: layer size and card position. */
  layout: RefObject<Layout | null>;
  /** Called by the backdrop when `layout` changes, to request a frame. */
  onInvalidate: (invalidate: () => void) => void;
  onReady: () => void;
  /** Replaces the scroll choreography (poster renders). */
  pose?: (t: number, layout: Layout) => Pose;
}

export default function KatanaScene({ src, progress, layout, onInvalidate, onReady, pose = poseAt }: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      // Only renders when the scroll position or the layout changes.
      frameloop="demand"
      camera={{ fov: FOV, near: 0.1, far: 1000, position: [0, 0, 50] }}
      gl={{ antialias: true, alpha: true, toneMapping: AgXToneMapping, toneMappingExposure: 1.05 }}
      // Decorative: the card next to it names the project.
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <Studio />
      <Suspense fallback={null}>
        <Katana
          src={src}
          progress={progress}
          layout={layout}
          onInvalidate={onInvalidate}
          onReady={onReady}
          pose={pose}
        />
      </Suspense>
      <PixelCamera />
    </Canvas>
  );
}

/**
 * Studio lighting in the spirit of the Blender render: a polished blade is a
 * mirror, so what it shows is the environment. Built from Lightformers (soft
 * boxes, and dark flags that are just unlit panels), so nothing is downloaded.
 *
 * Each theme gets its own room, so the steel reads against the page behind it:
 * - Dark page: a charcoal room with bright soft boxes. The steel shows long
 *   bright bands over dark grey, and a back rim draws its outline against the
 *   near-black page.
 * - Light page: a bright, warm room, like a product shot on paper. The steel
 *   turns silver instead of a black bar, and dark flags above and below give
 *   it the dark bands that make it read as metal and keep its edges defined
 *   against the light page. No bright rim: it would melt into the page.
 */
type Panel = {
  intensity: number;
  color?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
};

interface StudioSetup {
  /** Ambient sky and ground colours. */
  hemisphere: [string, string, number];
  /** Key light from the front, upper right: wrap, wood and guard. */
  key: { color: string; intensity: number };
  /** Rim light from behind. */
  rim: number;
  /** The room's base colour, what the steel reflects where no panel is. */
  room: string;
  environmentIntensity: number;
  exposure: number;
  panels: Panel[];
}

const STUDIO: Record<'light' | 'dark', StudioSetup> = {
  dark: {
    hemisphere: ['#f4f1ec', '#2a2622', 0.45],
    key: { color: '#ffffff', intensity: 1.5 },
    rim: 1.6,
    // Charcoal, not black: where the steel mirrors no panel it reads as dark
    // grey metal, a step above the near-black page, instead of vanishing.
    room: '#3a3836',
    environmentIntensity: 1.45,
    exposure: 1.05,
    panels: [
      // Ceiling soft box: the broad highlight along the flat of the blade.
      { intensity: 1.7, position: [0, 6, 1], rotation: [Math.PI / 2, 0, 0], scale: [14, 4, 1] },
      // Low frontal panel: the silver gradient near the habaki.
      { intensity: 1.2, position: [-4, -1.5, 6], scale: [6, 1.6, 1] },
      // Side panels for the edges and the guard.
      { intensity: 1.2, position: [-7, 1, 0], rotation: [0, Math.PI / 2, 0], scale: [8, 3, 1] },
      { intensity: 0.7, position: [7, 1, 0], rotation: [0, -Math.PI / 2, 0], scale: [8, 3, 1] },
      // Back rim: separates the dark steel from a dark page.
      { intensity: 1.6, position: [0, 2, -7], scale: [14, 1.2, 1] },
      // Floor bounce, warm and dim.
      { intensity: 0.3, color: '#d9cbb5', position: [0, -5, 0], rotation: [-Math.PI / 2, 0, 0], scale: [14, 8, 1] },
    ],
  },
  light: {
    // Warm, paper-like fill, with a darker ground so the underside keeps shape.
    hemisphere: ['#fbf6ee', '#5d5549', 0.55],
    key: { color: '#fff4e6', intensity: 1.35 },
    rim: 0.4,
    room: '#c9c0b2',
    environmentIntensity: 1,
    exposure: 1,
    panels: [
      // Ceiling soft box, broad and bright: the silver of the flat.
      { intensity: 2.2, color: '#fffaf2', position: [0, 6, 1], rotation: [Math.PI / 2, 0, 0], scale: [14, 4, 1] },
      // Frontal panel: a soft highlight that runs down the blade.
      { intensity: 1.4, color: '#fffaf2', position: [-3, -1, 6], scale: [8, 2, 1] },
      // Side panels for the edges and the guard.
      { intensity: 1.1, position: [-7, 1, 0], rotation: [0, Math.PI / 2, 0], scale: [8, 3, 1] },
      { intensity: 0.9, position: [7, 1, 0], rotation: [0, -Math.PI / 2, 0], scale: [8, 3, 1] },
      // Dark flags (the page's ink): the dark band along the lower bevel and a
      // dark back, so the edge and spine stay drawn against the paper.
      { intensity: 1, color: '#1f1b16', position: [0, -5, 1], rotation: [-Math.PI / 2, 0, 0], scale: [14, 3, 1] },
      { intensity: 1, color: '#2a2622', position: [0, 1, -7], scale: [14, 2.5, 1] },
    ],
  },
};

function Studio() {
  const dark = useDarkTheme();
  const theme = dark ? 'dark' : 'light';
  const setup = STUDIO[theme];
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    gl.toneMappingExposure = setup.exposure;
    invalidate();
  }, [gl, setup, invalidate]);

  return (
    <>
      <hemisphereLight args={setup.hemisphere} />
      <directionalLight position={[3, 5, 6]} color={setup.key.color} intensity={setup.key.intensity} />
      <directionalLight position={[-4, 2, -5]} intensity={setup.rim} />
      {/* The cube map renders once per theme (frames={1} renders again when
          its children change), not every frame. */}
      <Environment resolution={512} frames={1} environmentIntensity={setup.environmentIntensity}>
        <color attach="background" args={[setup.room]} />
        {setup.panels.map((panel, i) => (
          // Keyed by theme: each room mounts fresh, with no rotation left over.
          <Lightformer key={`${theme}-${i}`} form="rect" {...panel} />
        ))}
      </Environment>
    </>
  );
}

/** The page theme: the header switch (<html data-theme>) or, before any choice, the system. */
function useDarkTheme() {
  const read = () =>
    document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
    };
  }, []);
  return dark;
}

/** Keeps PX CSS pixels per unit on the z = 0 plane, whatever the canvas size. */
function PixelCamera() {
  const camera = useThree((state) => state.camera);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const distance = height / PX / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(0, 0, distance);
    camera.near = distance / 20;
    camera.far = distance * 4;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, height, invalidate]);

  return null;
}

// useGLTF caches the scene between mounts, so it is never transformed in place
// (see CharacterStage): the length is measured once, poses go on wrapping groups.
const lengths = new WeakMap<Object3D, number>();

function modelLength(scene: Object3D) {
  let length = lengths.get(scene);
  if (length === undefined) {
    length = new Box3().setFromObject(scene).getSize(new Vector3()).z;
    lengths.set(scene, length);
  }
  return length;
}

function Katana({ src, progress, layout, onInvalidate, onReady, pose: poseFn }: Required<Props>) {
  // Plain glTF: textures are WebP, geometry is uncompressed on purpose.
  const { scene } = useGLTF(src, false, false);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const length = modelLength(scene);

  const pose = useRef<Group>(null);
  const roll = useRef<Group>(null);
  const announced = useRef(false);

  // Sharp textures at grazing angles: the blade is mostly seen edge-on.
  useMemo(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy();
    scene.traverse((child) => {
      const material = (child as Mesh).material as (Material & Record<string, unknown>) | undefined;
      if (!material) return;
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
        const texture = material[key] as { anisotropy: number; needsUpdate: boolean } | null;
        if (texture && texture.anisotropy !== anisotropy) {
          texture.anisotropy = anisotropy;
          texture.needsUpdate = true;
        }
      }
    });
  }, [gl, scene]);

  useEffect(() => progress.on('change', () => invalidate()), [progress, invalidate]);
  useEffect(() => onInvalidate(invalidate), [onInvalidate, invalidate]);

  useFrame(() => {
    const current = layout.current;
    if (!current || !pose.current || !roll.current) return;
    const p = poseFn(progress.get(), current);
    const scale = p.length / PX / length;
    pose.current.position.set(p.x / PX, p.y / PX, p.z / PX);
    // Screen tilt, then the turn towards the viewer.
    pose.current.rotation.set(0, p.yaw, p.tilt, 'ZYX');
    pose.current.scale.setScalar(scale);
    roll.current.rotation.z = p.roll;
    if (!announced.current) {
      announced.current = true;
      // Wait for this frame to reach the screen before revealing the canvas.
      requestAnimationFrame(() => onReady());
    }
  });

  return (
    <group ref={pose}>
      {/* The model points along +Z; turn it to point along +X (tip to the right). */}
      <group rotation-y={Math.PI / 2}>
        <group ref={roll}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}
