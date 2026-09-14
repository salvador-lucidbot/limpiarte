const SIZES: Record<string, string> = {
  sm: "h-9 w-9",
  md: "h-20 w-20",
  lg: "h-32 w-32"
};

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loader({ size = "md", label = "Cargando", fullScreen = false, className = "" }: LoaderProps): React.ReactNode {
  const wrapper = fullScreen ? "flex min-h-[60vh] items-center justify-center" : "flex items-center justify-center py-10";

  return (
    <div role="status" aria-live="polite" className={`${wrapper} ${className}`}>
      <video
        src="/animation-logo-loading.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        suppressHydrationWarning
        className={`${SIZES[size]} object-contain mix-blend-multiply`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
