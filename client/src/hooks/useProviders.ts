import { useEffect, useState } from "react";

export type OGProvider = {
  provider: string;
  model?: string;
  serviceType?: string;
  inputPrice?: string;
  outputPrice?: string;
  verifiability?: string;
  status?: string;
  [k: string]: any;
};

export function useProviders() {
  const [providers, setProviders] = useState<OGProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/0g/compute/providers");
      if (!res.ok) throw new Error(`Failed to fetch providers: ${res.status}`);
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return { providers, loading, error, refetch: fetchProviders };
}