import type { Demonstration } from '@/data/programme';

interface ExerciseMediaProps {
  media: Demonstration;
  /** Names the pose for assistive tech; empty marks the media decorative. */
  label: string;
  className?: string;
}

/**
 * Shows whichever demonstration an exercise carries, preferring the clip: the
 * same animation costs about a quarter of the GIF over the wire.
 */
export function ExerciseMedia({ media, label, className }: ExerciseMediaProps) {
  if (media.video) {
    return (
      <video
        src={media.video}
        className={className}
        // iOS Safari only starts a clip nobody asked for while it is muted and
        // allowed to stay inline; without both it refuses or goes fullscreen.
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
      />
    );
  }

  if (!media.image) return null;

  return <img src={media.image} alt={label} className={className} />;
}
