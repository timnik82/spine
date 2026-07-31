interface AlternatingPosePairProps {
  /** The two poses, in right-then-left order. */
  images: readonly [right: string, left: string];
  className?: string;
}

/**
 * Two poses gently fading into each other on an exercise introduction. Keeping
 * both images in place avoids a layout jump while one fades into the other; the
 * cross-fade itself lives in `index.css` (`.exercise-side-pose`).
 *
 * Timed side exercises pick a single pose from their reducer state in
 * ActiveScreen; this pair is only shown while a side is *not* decided yet — an
 * introduction or a repetition block where the child swaps within each rep.
 */
export function AlternatingPosePair({
  images,
  className = '',
}: AlternatingPosePairProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <img
        src={images[0]}
        alt=""
        aria-hidden="true"
        className={`exercise-side-pose ${className}`}
      />
      <img
        src={images[1]}
        alt=""
        aria-hidden="true"
        className={`exercise-side-pose exercise-side-pose--left absolute ${className}`}
      />
    </div>
  );
}
