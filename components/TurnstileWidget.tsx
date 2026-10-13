"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  /** Change this value to get a fresh token (each token can only be verified once). */
  resetKey: number;
};

/** Cloudflare Turnstile CAPTCHA, rendered explicitly so it also works after client-side navigation. */
export default function TurnstileWidget({ siteKey, onToken, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const turnstile = window.turnstile;
    if (!scriptReady || !turnstile || !containerRef.current) return;
    const widgetId = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => onTokenRef.current(""),
    });
    widgetIdRef.current = widgetId;
    return () => {
      turnstile.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, [scriptReady, siteKey]);

  useEffect(() => {
    if (resetKey && widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
      onTokenRef.current("");
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
