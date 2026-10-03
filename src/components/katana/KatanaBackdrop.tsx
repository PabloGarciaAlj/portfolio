import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useReducedMotion, useScroll, useSpring } from 'motion/react';
import { NOMINAL_LAYOUTS, POSTER, poseAt, type Layout } from './pose';

/**
 * The poster's place, from the mid-scroll pose on the nominal layouts, in units
 * of the card width (cqw of the projects section, see .katana-poster in
 * global.css). CSS only, so it is right before hydration and without JS.
 */
const posterPlacement = Object.fromEntries([
  ['--poster-habaki-x', POSTER.habakiX],
  ['--poster-habaki-y', POSTER.habakiY],
  ['--poster-width-per-length', POSTER.widthPerLength],
  ['--poster-aspect', POSTER.aspect],
  ...Object.entries(NOMINAL_LAYOUTS).flatMap(([name, layout]) => {
    const pose = poseAt(0.5, layout);
    const unit = layout.card.width / 100;
    const suffix = name === 'compact' ? '-compact' : '';
    return [
      [`--poster-x${suffix}`, `${(pose.x / unit).toFixed(3)}cqw`],
      // Down from the card's top edge, so it does not depend on the card height.
      [`--poster-y${suffix}`, `${((layout.card.y + layout.card.height / 2 - pose.y) / unit).toFixed(3)}cqw`],
      [`--poster-length${suffix}`, `${(pose.length / unit).toFixed(3)}cqw`],
      [`--poster-tilt${suffix}`, `${(-pose.tilt).toFixed(4)}rad`],
    ];
  }),
]) as CSSProperties;

// three.js and the model only download when the section comes near.
const KatanaScene = lazy(() => import('./KatanaScene'));

interface Props {
  src: string;
  /** Static render shown without JS or WebGL, under reduced motion and while loading. */
  poster: { src: string; width: number; height: number };
  /** The TFG card. It stays in front: the katana lives behind it and around its edges. */
  children: ReactNode;
}

/**
 * The TFG katana behind the thesis card, moved by the scroll. The canvas is a
 * full-bleed layer below the section content (negative z-index inside the
 * section's stacking context), taller than the card by `--katana-bleed` above
 * and below, so the katana can show around it without covering any text.
 */
export default function KatanaBackdrop({ src, poster, children }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const layout = useRef<Layout | null>(null);
  const invalidate = useRef<() => void>(() => {});
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // 0 when the card enters at the bottom of the viewport, 1 when it leaves at the
  // top. A soft spring takes the steps out of wheel scrolling without lagging.
  const { scrollYProgress } = useScroll({ target: wrapper, offset: ['start end', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 170, damping: 34, mass: 0.5, restDelta: 0.0001 });

  // Layer size and card position, in the layer's coordinates (y up).
  useEffect(() => {
    const measure = () => {
      if (!layer.current || !card.current) return;
      const l = layer.current.getBoundingClientRect();
      const c = card.current.getBoundingClientRect();
      layout.current = {
        width: l.width,
        height: l.height,
        card: {
          x: c.left + c.width / 2 - (l.left + l.width / 2),
          y: l.top + l.height / 2 - (c.top + c.height / 2),
          width: c.width,
          height: c.height,
        },
        compact: window.matchMedia('(max-width: 767px)').matches,
      };
      invalidate.current();
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (layer.current) observer.observe(layer.current);
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, []);

  // Load the scene once the section is close, when the browser is idle.
  useEffect(() => {
    if (reducedMotion !== false || !supportsWebGL() || !wrapper.current) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        // Safari has no requestIdleCallback.
        const whenIdle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 300));
        timer = whenIdle(() => setMounted(true), { timeout: 1500 });
      },
      { rootMargin: '50% 0px' },
    );
    observer.observe(wrapper.current);
    return () => {
      observer.disconnect();
      (window.cancelIdleCallback ?? window.clearTimeout)(timer);
    };
  }, [reducedMotion]);

  const handleInvalidate = useCallback((fn: () => void) => {
    invalidate.current = fn;
    fn();
  }, []);
  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  const live = mounted && !failed;

  return (
    <div ref={wrapper} className="katana-backdrop relative">
      <div
        ref={layer}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -z-10 w-screen -translate-x-1/2"
        style={{ top: 'calc(var(--katana-bleed) * -1)', bottom: 'calc(var(--katana-bleed) * -1)' }}
      >
        <img
          src={poster.src}
          width={poster.width}
          height={poster.height}
          alt=""
          loading="lazy"
          decoding="async"
          className="katana-poster transition-opacity duration-500 ease-out data-[hidden=true]:opacity-0"
          style={posterPlacement}
          data-hidden={ready && !failed}
        />
        {live && (
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out data-[ready=true]:opacity-100"
            data-ready={ready}
          >
            <SceneBoundary onError={handleError}>
              <Suspense fallback={null}>
                <KatanaScene
                  src={src}
                  progress={progress}
                  layout={layout}
                  onInvalidate={handleInvalidate}
                  onReady={handleReady}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}
      </div>
      <div ref={card}>{children}</div>
    </div>
  );
}

function supportsWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** A failed download or a lost context leaves the poster in place. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
