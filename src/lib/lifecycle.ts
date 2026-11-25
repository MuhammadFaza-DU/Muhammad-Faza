import type { PageContext } from "../data/types.ts";

export type Enhancement = (context: PageContext) => () => void;

export function createEnhancementRegistry() {
  const mounts = new Map<string, Enhancement>();
  const cleanups = new Map<string, () => void>();
  let context: PageContext | null = null;
  const dispose = () => {
    for (const cleanup of cleanups.values()) cleanup();
    cleanups.clear();
    context = null;
  };
  return {
    register(key: string, mount: Enhancement): () => void {
      if (!mounts.has(key)) {
        mounts.set(key, mount);
        if (context) cleanups.set(key, mount(context));
      }
      return () => {
        cleanups.get(key)?.();
        cleanups.delete(key);
        mounts.delete(key);
      };
    },
    activate(next: PageContext) {
      if (context?.pathname === next.pathname && context.locale === next.locale) return;
      dispose();
      context = next;
      for (const [key,mount] of mounts) cleanups.set(key,mount(next));
    },
    dispose,
  };
}
