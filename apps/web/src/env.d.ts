/// <reference types="astro/client" />

interface Window {
  umami?: {
    track(name: string, data: Record<string, string>): Promise<unknown>;
  };
}
