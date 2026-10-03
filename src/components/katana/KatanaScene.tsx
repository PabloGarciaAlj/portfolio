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
 * mirror, so what it shows is the environment. Soft boxes in a dark room give
 * the long light gradients along the steel; a key and a rim light
 * model the non-metal parts (wrap, wood, guard). Built from Lightformers, so
 * nothing is downloaded.
 */
function Studio() {
  // On the dark page the near-black steel needs brighter reflections to keep
  // its outline; on the light page the render's balance works as is.
  const dark = useDarkTheme();
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [dark, invalidate]);

  return (
    <>
      <hemisphereLight args={['#f4f1ec', '#2a2622', dark ? 0.45 : 0.35]} />
      <directionalLight position={[3, 5, 6]} intensity={1.5} />
      <directionalLight position={[-4, 2, -5]} intensity={dark ? 1.6 : 1.1} />
      <Environment resolution={512} frames={1} environmentIntensity={dark ? 1.45 : 1}>
        {/* A dark room: the steel reads near black, with bright bands where it
            catches the soft boxes, as in the render. */}
        <color attach="background" args={['#161616']} />
        {/* Ceiling soft box: the broad highlight along the flat of the blade. */}
        <Lightformer form="rect" intensity={1.7} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[14, 4, 1]} />
        {/* Low frontal panel: the silver gradient near the habaki. */}
        <Lightformer form="rect" intensity={1.2} position={[-4, -1.5, 6]} scale={[6, 1.6, 1]} />
        {/* Side panels for the edges and the guard. */}
        <Lightformer form="rect" intensity={1.2} position={[-7, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[7, 1, 0]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        {/* Back rim: separates the dark steel from a dark page. */}
        <Lightformer form="rect" intensity={1.6} position={[0, 2, -7]} scale={[14, 1.2, 1]} />
        {/* Floor bounce, warm and dim. */}
        <Lightformer form="rect" intensity={0.3} color="#d9cbb5" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[14, 8, 1]} />
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
