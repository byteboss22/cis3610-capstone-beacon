'use client';
import { useEffect, useState } from 'react';
import type { z } from 'zod';

export default function useResource<T>(url: string, schema: z.ZodType<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]), cache: 'no-store' });
        if (!response.ok) throw new Error('Request unavailable');
        const parsed = schema.parse(await response.json());
        if (!controller.signal.aborted) setData(parsed);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [url, schema, attempt]);
  function retry() { setData(null); setError(false); setLoading(true); setAttempt(value => value + 1); }
  return { data, error, loading, retry };
}
