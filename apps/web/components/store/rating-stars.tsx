import { IconStarFilled } from "../icons";

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export function RatingStars({ rating, size = 14 }: RatingStarsProps): React.ReactNode {
  const percentage = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span className="relative inline-flex" aria-label={`Calificación ${rating} de 5`}>
      <span className="flex text-slate-300">
        {[1, 2, 3, 4, 5].map((index) => (
          <IconStarFilled key={index} size={size} />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-amber-400" style={{ width: `${percentage}%` }}>
        {[1, 2, 3, 4, 5].map((index) => (
          <IconStarFilled key={index} size={size} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
