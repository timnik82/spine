import { programme } from '@/data/programme';

interface ExerciseNavProps {
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export function ExerciseNav({
  currentIndex,
  onPrev,
  onNext,
  onSelect,
}: ExerciseNavProps) {
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= programme.length - 1;

  return (
    <nav
      aria-label="Navegação rápida de exercícios"
      // Exercise names run long, so the bar is held inside the viewport and the
      // name gives way first: the two controls must stay reachable at any width.
      className="fixed left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-xs shadow-md backdrop-blur-md transition-all sm:gap-2"
      style={{ top: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className="shrink-0 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Exercício anterior"
      >
        ‹ Anterior
      </button>

      <select
        value={currentIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="min-w-0 flex-1 cursor-pointer truncate rounded-md bg-transparent px-1.5 py-0.5 font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
        aria-label="Selecionar exercício"
      >
        {programme.map((ex, idx) => (
          <option key={ex.id} value={idx}>
            {idx + 1}/{programme.length}: {ex.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onNext}
        disabled={isLast}
        className="shrink-0 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Próximo exercício"
      >
        Seguinte ›
      </button>
    </nav>
  );
}
