import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  ArrowArcLeftIcon,
  ArrowArcRightIcon,
  ArrowCounterClockwiseIcon,
  CubeIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@phosphor-icons/react';
import type { StageHandle } from './CharacterStage';

// three.js and the scene only download when the visitor asks for the model.
const CharacterStage = lazy(() => import('./CharacterStage'));

interface Props {
  src: string;
  /** Approximate download size shown on the button, e.g. "7 MB". */
  size: string;
  poster: { src: string; width: number; height: number };
  alt: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function CharacterViewer({ src, size, poster, alt }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
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

  return (
    <figure className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-sunken sm:aspect-[16/10]">
      <img
        src={poster.src}
        width={poster.width}
        height={poster.height}
        alt={alt}
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out-strong data-[hidden=true]:opacity-0"
        data-hidden={status === 'ready'}
      />

      {status !== 'idle' && status !== 'error' && (
        <StageBoundary onError={handleError}>
          <Suspense fallback={null}>
            <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
              <CharacterStage
                src={src}
                handle={stage}
                onReady={handleReady}
                onProgress={setProgress}
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
            Ver en 3D
            <span className="font-mono text-xs opacity-70">{size}</span>
          </button>
        </div>
      )}

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center font-mono text-xs text-muted sm:p-6"
        aria-live="polite"
      >
        {status === 'loading' && `Cargando modelo · ${Math.round(progress)} %`}
        {status === 'error' && 'No se ha podido cargar el visor 3D en este navegador.'}
      </p>

      {status === 'ready' && (
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-3 sm:p-4">
          <p className="hidden font-mono text-xs text-muted sm:block">
            Arrastra para girar · Rueda o pellizco para acercar
          </p>
          <div
            role="toolbar"
            aria-label="Controles del visor 3D"
            className="ml-auto flex gap-1 rounded-xl border border-line bg-canvas/85 p-1 backdrop-blur-md"
          >
            <ToolButton ref={firstTool} label="Girar a la izquierda" onClick={() => stage.current?.rotate(-1)}>
              <ArrowArcLeftIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Girar a la derecha" onClick={() => stage.current?.rotate(1)}>
              <ArrowArcRightIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Acercar" onClick={() => stage.current?.zoom(1)}>
              <MagnifyingGlassPlusIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Alejar" onClick={() => stage.current?.zoom(-1)}>
              <MagnifyingGlassMinusIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Restablecer vista" onClick={() => stage.current?.reset()}>
              <ArrowCounterClockwiseIcon size={18} weight="bold" aria-hidden="true" />
            </ToolButton>
          </div>
        </figcaption>
      )}
    </figure>
  );
}

function ToolButton({
  ref,
  label,
  onClick,
  children,
}: {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-10 place-items-center pointer-coarse:size-11 rounded-lg text-muted transition-[color,background-color,transform] duration-150 ease-out hover:bg-sunken hover:text-ink active:scale-[0.96]"
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
