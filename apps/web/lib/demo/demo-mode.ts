export const DEMO_TOKEN = "demo-mode-no-token";

export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;

  return true;
}
