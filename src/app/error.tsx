"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 pt-10 pb-16 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-emerald-300/80">ERROR</p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300/90">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn btn-primary focus-ring mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-emerald-100"
      >
        Try again
      </button>
    </div>
  );
}
