import { Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, type Ref } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import {
  AnimationClip,
  AnimationMixer,
  Box3,
  LoopOnce,
  LoopRepeat,
  NeutralToneMapping,
  Vector3,
  type AnimationAction,
  type Object3D,
} from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// The character is normalised to this height (scene units) so camera limits
// do not depend on the scale it was exported with.
const HEIGHT = 1.8;
const TARGET = new Vector3(0, HEIGHT * 0.52, 0);
const FOV = 30;
const MIN_DISTANCE = 0.9;
const ZOOM_STEP = 0.85;
const ROTATE_STEP = Math.PI / 12;
// Cross-fade between two clips, in seconds.
const FADE = 0.3;
// Caps the mixer step so a long pause (hidden tab, held idle) does not jump the clip.
const MAX_STEP = 0.25;

export interface StageHandle {
  rotate: (direction: 1 | -1) => void;
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
}

/** A clip the visitor can play: looping (walk, sneak) or once (attacks). */
export interface Clip {
  clip: string;
  loop: boolean;
}

interface Props {
  src: string;
  handle: Ref<StageHandle>;
  onReady: () => void;
  onProgress: (percent: number) => void;
  /** Clip that plays when nothing else does; null leaves the bind pose. */
  idle: string | null;
  /** Clip to play instead of the idle, or null. */
  clip: Clip | null;
  onClipEnd: () => void;
}

export default function CharacterStage({ src, handle, onReady, onProgress, idle, clip, onClipEnd }: Props) {
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
          <Character src={src} idle={idle} clip={clip} onClipEnd={onClipEnd} onReady={onReady} />
        </Suspense>

        <Rig handle={handle} />
      </Canvas>
    </>
  );
}

function useReducedMotion() {
  return useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
}

function ProgressReporter({ onProgress }: { onProgress: (percent: number) => void }) {
  const progress = useProgress((state) => state.progress);
  useEffect(() => onProgress(progress), [progress, onProgress]);
  return null;
}

// useGLTF caches the loaded scene across mounts (and across view-transition
// navigations), so it must never be transformed in place: a second visit would
// measure the already scaled copy. The framing is measured once per scene, on
// the pristine one, and applied to a wrapping group instead.
const framings = new WeakMap<Object3D, { scale: number; offset: Vector3 }>();

function getFraming(scene: Object3D) {
  let framing = framings.get(scene);
  if (!framing) {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = HEIGHT / size.y;
    framing = { scale, offset: new Vector3(-center.x, -box.min.y, -center.z).multiplyScalar(scale) };
    framings.set(scene, framing);
    scene.traverse((child) => {
      // Skinned bounds are computed in bind pose; avoid parts popping out
      // when the camera gets close or the character moves.
      child.frustumCulled = false;
    });
  }
  return framing;
}

interface CharacterProps {
  src: string;
  idle: string | null;
  clip: Clip | null;
  onClipEnd: () => void;
  onReady: () => void;
}

function Character({ src, idle, clip, onClipEnd, onReady }: CharacterProps) {
  // No Draco: the file uses meshopt, whose decoder ships with three-stdlib.
  const { scene, animations } = useGLTF(src, false, true);
  const { scale, offset } = getFraming(scene);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();

  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const current = useRef<AnimationAction | null>(null);
  const fading = useRef(new Set<AnimationAction>());
  const onClipEndRef = useRef(onClipEnd);
  useEffect(() => {
    onClipEndRef.current = onClipEnd;
  }, [onClipEnd]);

  // Under reduced motion the idle holds its first pose; clips the visitor asks
  // for still play. The contact shadow only re-renders while something moves.
  const holdIdle = reducedMotion && !clip;

  // Leave the cached scene in its rest pose for the next mount.
  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    },
    [mixer, scene],
  );

  // One-shot clips (attacks) hand control back when they finish.
  useEffect(() => {
    const onFinished = (event: { action: AnimationAction }) => {
      if (event.action === current.current) onClipEndRef.current();
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [mixer]);

  const target = clip?.clip ?? idle;
  const once = clip ? !clip.loop : false;
  useEffect(() => {
    const source = target ? AnimationClip.findByName(animations, target) : null;
    const next = source ? mixer.clipAction(source) : null;
    const previous = current.current;
    if (next) {
      fading.current.delete(next);
      next.reset();
      next.setLoop(once ? LoopOnce : LoopRepeat, Infinity);
      next.clampWhenFinished = once;
      next.paused = false;
      // The first pose appears directly; later changes cross-fade.
      if (previous && previous !== next) next.fadeIn(FADE);
      next.play();
    }
    if (previous && previous !== next) {
      previous.fadeOut(FADE);
      fading.current.add(previous);
    }
    current.current = next;
    invalidate();
  }, [animations, invalidate, mixer, once, target]);

  // Pausing (not stopping) keeps the idle's pose applied while it holds still.
  useEffect(() => {
    if (current.current) current.current.paused = holdIdle;
    invalidate();
  }, [holdIdle, invalidate, target]);

  useFrame((_, delta) => {
    mixer.update(Math.min(delta, MAX_STEP));
    for (const action of fading.current) {
      if (action.getEffectiveWeight() === 0) {
        action.stop();
        fading.current.delete(action);
      }
    }
    const moving = (current.current && !current.current.paused) || fading.current.size > 0;
    if (moving) invalidate();
  });

  useEffect(() => onReady(), [onReady]);

  return (
    <>
      <group scale={scale} position={offset}>
        <primitive object={scene} />
      </group>
      <ContactShadows
        // Remount when motion stops so the still shadow matches the held pose.
        key={holdIdle ? 'still' : 'live'}
        position={[0, 0.001, 0]}
        scale={3}
        blur={2.4}
        far={1.2}
        opacity={0.45}
        frames={holdIdle ? 1 : Infinity}
      />
    </>
  );
}

/** Orbit controls framed on the character, plus the imperative API used by the buttons. */
function Rig({ handle }: { handle: Ref<StageHandle> }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  // Distance that fits the whole character with some air around it. Width only
  // decides on narrow (portrait) viewers; half a body height each side leaves
  // room for the katana in the attacks.
  const fitDistance = useMemo(() => {
    const vFov = (FOV * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const byHeight = (HEIGHT * 0.62) / Math.tan(vFov / 2);
    const byWidth = (HEIGHT * 0.5) / Math.tan(hFov / 2);
    return Math.max(byHeight, byWidth);
  }, [aspect]);
  const maxDistance = fitDistance * 1.5;
  // Orbit inertia keeps the camera moving after release: off under reduced motion.
  const reducedMotion = useReducedMotion();

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
      // Almost a top view, and a little below the floor to see the soles,
      // without flipping over the poles.
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI * 0.62}
    />
  );
}
