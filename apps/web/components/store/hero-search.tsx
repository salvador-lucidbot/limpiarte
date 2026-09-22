"use client";

import { useRouter } from "next/navigation";
import { SearchAutocomplete } from "./search-autocomplete";

interface HeroSearchProps {
  suggestions: string[];
}

export function HeroSearch({ suggestions }: HeroSearchProps): React.ReactNode {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="group relative">
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-accent/60 opacity-40 blur transition duration-500 group-hover:opacity-60" />
        <div className="relative">
          <SearchAutocomplete variant="hero" />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="mb-1 w-full text-center text-xs font-bold uppercase tracking-widest text-white/60">Búsquedas populares</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => router.push(`/tienda?q=${encodeURIComponent(suggestion)}`)}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur transition-all hover:border-primary hover:bg-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
