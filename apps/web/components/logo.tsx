interface LogoProps {
  variant?: "color" | "white";
  height?: number;
  withText?: boolean;
}

export function LogoMark({ variant = "color", height = 34 }: { variant?: "color" | "white"; height?: number }): React.ReactNode {
  const primary = variant === "white" ? "#ffffff" : "#29abe2";

  return (
    <svg height={height} viewBox="0 0 44 40" fill="none" aria-hidden>
      <path
        d="M4 20.5 20.5 6.8a2.4 2.4 0 0 1 3 0l7 5.8V9.2a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v7.4l2.9 2.4"
        stroke={primary}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 22.5v10.3A2.2 2.2 0 0 0 11.7 35h20.6a2.2 2.2 0 0 0 2.2-2.2V22.5"
        stroke={primary}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 27.2h9a0 0 0 0 1 0 0v3.6a2.6 2.6 0 0 1-2.6 2.6h-3.8a2.6 2.6 0 0 1-2.6-2.6z"
        stroke={primary}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M19.6 27v-1.7M24.4 27v-1.7" stroke={primary} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M39.2 2.2l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1z"
        fill={primary}
      />
    </svg>
  );
}

export function Logo({ variant = "color", height = 34, withText = true }: LogoProps): React.ReactNode {
  const textColor = variant === "white" ? "text-white" : "text-brand-500";

  return (
    <span className="inline-flex items-center gap-1.5">
      <LogoMark variant={variant} height={height} />
      {withText && (
        <span className={`font-logo text-2xl font-extrabold leading-none tracking-tight ${textColor}`} style={{ fontSize: height * 0.72 }}>
          Limpiarte
        </span>
      )}
    </span>
  );
}
