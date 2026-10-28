export interface GalleryImage {
  url: string;
  alt: string | null;
}

export type ViewerTab = "videos" | "images" | "documents";

export interface ViewerRequest {
  tab: ViewerTab;
  index: number;
}

export const VIEWER_TAB_LABELS: Record<ViewerTab, string> = {
  videos: "Videos",
  images: "Imágenes",
  documents: "Documentos"
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
