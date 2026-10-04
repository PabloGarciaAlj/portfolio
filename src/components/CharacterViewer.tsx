import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  ArrowArcLeftIcon,
  ArrowArcRightIcon,
  ArrowCounterClockwiseIcon,
  CubeIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PauseIcon,
  PlayIcon,
  SwordIcon,
} from '@phosphor-icons/react';
import type { Clip, StageHandle } from './CharacterStage';
import type { ViewerLabels } from '../i18n/ui';

// three.js and the scene only download when the visitor asks for the model.
const CharacterStage = lazy(() => import('./CharacterStage'));

interface Props {
  src: string;
  /** Approximate download size shown on the button, e.g. "7 MB". */
  size: string;
  poster: { src: string; width: number; height: number };
  alt: string;
  /** Clip in the .glb that plays while the visitor has not picked another. */
  idle?: string;
  /**
   * Clips the visitor can play, with their visible label. Looping clips (walk,
   * sneak) toggle on and off; the rest (attacks) play once and return to the idle.
   */
  animations?: (Clip & { label: string })[];
  /** Interface text in the page language. */
  labels: ViewerLabels;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function CharacterViewer({ src, size, poster, alt, idle, animations = [], labels }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const stage = useRef<StageHandle>(null);
  const firstTool = useRef<HTMLButtonElement>(null);
  const loadButton = useRef<HTMLButtonElement>(null);
  // The load button unmounts on click; remember whether it had focus so
  // keyboard users land on the viewer controls instead of the page top.
  const restoreFocus = useRef(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (status === 'ready' && restoreFocus.current) firstTool.current?.focus();
  }, [status]);
  const handleReady = useCallback(() => setStatus('ready'), []);
  const handleError = useCallback(() => setStatus('error'), []);
  const handleClipEnd = useCallback(() => setClip(null), []);
  const groups = [
    { label: labels.movement, clips: animations.filter((a) => a.loop) },
    { label: labels.attacks, clips: animations.filter((a) => !a.loop) },
  ].filter((group) => group.clips.length > 0);

  // Controls render as soon as the visitor asks for the model (disabled until it
  // is ready), so the space they take below the viewer on phones never shifts
  // the page after loading.
  const showControls = status === 'loading' || status === 'ready';
  const ready = status === 'ready';

  return (
    <div className="relative">
      <figure className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-sunken sm:aspect-[16/10]">
        <img
          src={poster.src}
          width={poster.width}
          height={poster.height}
          alt={alt}
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out-strong data-[hidden=true]:opacity-0"
          data-hidden={ready}
        />

        {showControls && (
          <StageBoundary onError={handleError}>
            <Suspense fallback={null}>
              <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                <CharacterStage
                  src={src}
                  handle={stage}
                  onReady={handleReady}
                  onProgress={setProgress}
                  idle={idle ?? null}
                  clip={clip}
                  onClipEnd={handleClipEnd}
                />
              </div>
            </Suspense>
          </StageBoundary>
        )}

        {/* Without JS the poster is the whole experience: no dead button. */}
        {hydrated && status === 'idle' && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
            <button
              ref={loadButton}
              type="button"
              className="btn btn-primary"
              onClick={() => {
                restoreFocus.current = document.activeElement === loadButton.current;
                setStatus('loading');
              }}
            >
              <CubeIcon size={18} weight="bold" aria-hidden="true" />
              {labels.load}
              <span className="font-mono text-xs opacity-70">{size}</span>
            </button>
          </div>
        )}

        <p
          className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center font-mono text-xs text-muted sm:p-6"
          aria-live="polite"
        >
          {status === 'loading' && `${labels.loading} · ${Math.round(progress)} %`}
          {status === 'error' && labels.error}
        </p>

        {ready && (
          <figcaption className="pointer-events-none absolute bottom-0 left-0 hidden p-4 font-mono text-xs text-muted sm:block">
            {labels.hint}
          </figcaption>
        )}
      </figure>

      {/* Phones: controls sit below the viewer so they never cover the
          character. From sm up the wrapper dissolves and they float over it. */}
      {showControls && (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-2 sm:contents">
          {groups.length > 0 && (
            // The camera is left untouched: clips play in place, so the framing holds.
            <div className="flex flex-wrap gap-2 sm:absolute sm:top-4 sm:right-4 sm:justify-end">
              {groups.map((group) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={group.label}
                  className="flex gap-1 rounded-xl border border-line bg-canvas/85 p-1 backdrop-blur-md"
                >
                  {group.clips.map(({ clip: name, label, loop }) => {
                    const active = clip?.clip === name;
                    const Icon = !loop ? SwordIcon : active ? PauseIcon : PlayIcon;
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={!ready}
                        aria-pressed={active}
                        onClick={() => setClip(active ? null : { clip: name, loop })}
                        className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,transform,opacity] duration-150 ease-out pointer-coarse:h-11 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 ${active ? 'bg-ink text-canvas' : 'text-muted hover:bg-sunken hover:text-ink'}`}
                      >
                        <Icon size={16} weight={loop ? 'fill' : 'bold'} aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div
            role="toolbar"
            aria-label={labels.toolbar}
            className="ml-auto flex gap-1 rounded-xl border border-line bg-canvas/85 p-1 backdrop-blur-md sm:absolute sm:right-4 sm:bottom-4"
          >
            <ToolButton ref={firstTool} disabled={!ready} label={labels.rotateLeft} onClick={() => stage.current?.rotate(-1)}>
              <ArrowArcLeftIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton disabled={!ready} label={labels.rotateRight} onClick={() => stage.current?.rotate(1)}>
              <ArrowArcRightIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton disabled={!ready} label={labels.zoomIn} onClick={() => stage.current?.zoom(1)}>
              <MagnifyingGlassPlusIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton disabled={!ready} label={labels.zoomOut} onClick={() => stage.current?.zoom(-1)}>
              <MagnifyingGlassMinusIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton disabled={!ready} label={labels.reset} onClick={() => stage.current?.reset()}>
              <ArrowCounterClockwiseIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  ref,
  disabled,
  label,
  onClick,
  children,
}: {
  ref?: Ref<HTMLButtonElement>;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-10 place-items-center pointer-coarse:size-11 rounded-lg text-muted transition-[color,background-color,transform,opacity] duration-150 ease-out hover:bg-sunken hover:text-ink active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** WebGL unavailable or the model failed to load: fall back to the poster. */
class StageBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
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
