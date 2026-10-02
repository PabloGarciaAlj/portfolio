import { Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, type Ref } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { Box3, NeutralToneMapping, Vector3, type Object3D } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// The character is normalised to this height (scene units) so camera limits
// do not depend on the scale it was exported with.
const HEIGHT = 1.8;
const TARGET = new Vector3(0, HEIGHT * 0.52, 0);
const FOV = 30;
const MIN_DISTANCE = 0.9;
const ZOOM_STEP = 0.85;
const ROTATE_STEP = Math.PI / 12;

export interface StageHandle {
  rotate: (direction: 1 | -1) => void;
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
}

interface Props {
  src: string;
  handle: Ref<StageHandle>;
  onReady: () => void;
  onProgress: (percent: number) => void;
}

export default function CharacterStage({ src, handle, onReady, onProgress }: Props) {
  return (
    <>
      <ProgressReporter onProgress={onProgress} />
      <Canvas
        dpr={[1, 2]}
        frameloop="demand"
        camera={{ fov: FOV, near: 0.05, far: 50, position: [0, TARGET.y, 6] }}
        gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping }}
        aria-hidden="true"
      >
        {/* Soft ambient base plus a key and a rim light; the environment gives
            the metal parts (mask, katana) something to reflect. */}
        <hemisphereLight args={['#ffffff', '#2b2620', 1.1]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
        <directionalLight position={[-3, 2.5, -2.5]} intensity={0.9} />
        <Environment resolution={256} frames={1} environmentIntensity={0.6}>
          <Lightformer form="rect" intensity={2} position={[0, 3, 3]} scale={[4, 2, 1]} />
          <Lightformer form="rect" intensity={1} position={[-4, 1, -2]} scale={[2, 4, 1]} />
          <Lightformer form="rect" intensity={0.6} position={[4, 1, 0]} scale={[2, 4, 1]} />
        </Environment>

        <Suspense fallback={null}>
          <Character src={src} onReady={onReady} />
          <ContactShadows
            position={[0, 0.001, 0]}
            scale={3}
            blur={2.4}
            far={1.2}
            opacity={0.45}
            frames={1}
          />
        </Suspense>

        <Rig handle={handle} />
      </Canvas>
    </>
  );
}

function ProgressReporter({ onProgress }: { onProgress: (percent: number) => void }) {
  const progress = useProgress((state) => state.progress);
  useEffect(() => onProgress(progress), [progress, onProgress]);
  return null;
}

function Character({ src, onReady }: { src: string; onReady: () => void }) {
  // No Draco: the file uses meshopt, whose decoder ships with three-stdlib.
  const { scene } = useGLTF(src, false, true);

  const model = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = HEIGHT / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    scene.traverse((child: Object3D) => {
      // Skinned bounds are computed in bind pose; avoid parts popping out
      // when the camera gets close.
      child.frustumCulled = false;
    });
    return scene;
  }, [scene]);

  useEffect(() => onReady(), [onReady]);

  return <primitive object={model} />;
}

/** Orbit controls framed on the character, plus the imperative API used by the buttons. */
function Rig({ handle }: { handle: Ref<StageHandle> }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  // Distance that fits the whole character (T-pose is about as wide as tall)
  // with some air around it, for the current aspect ratio.
  const fitDistance = useMemo(() => {
    const vFov = (FOV * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const byHeight = (HEIGHT * 0.62) / Math.tan(vFov / 2);
    const byWidth = (HEIGHT * 0.58) / Math.tan(hFov / 2);
    return Math.max(byHeight, byWidth);
  }, [aspect]);
  const maxDistance = fitDistance * 1.5;
  // Orbit inertia keeps the camera moving after release: off under reduced motion.
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useLayoutEffect(() => {
    camera.position.set(fitDistance * 0.26, TARGET.y + 0.15, fitDistance * 0.96);
    camera.lookAt(TARGET);
    if (controls) {
      controls.target.copy(TARGET);
      controls.update();
      controls.saveState();
    }
    invalidate();
  }, [camera, controls, fitDistance, invalidate]);

  useImperativeHandle(
    handle,
    () => ({
      rotate(direction) {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new Vector3(0, 1, 0), direction * ROTATE_STEP);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
      zoom(direction) {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        const length = offset.length() * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
        offset.setLength(Math.min(maxDistance, Math.max(MIN_DISTANCE, length)));
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
      reset() {
        controls?.reset();
        invalidate();
      },
    }),
    [camera, controls, invalidate, maxDistance],
  );

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      // Wheel and pinch zoom towards the pointer, so the face or the katana
      // can be inspected without panning.
      zoomToCursor
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      rotateSpeed={0.7}
      minDistance={MIN_DISTANCE}
      maxDistance={maxDistance}
      // Never below the floor, never straight down from above.
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
}
