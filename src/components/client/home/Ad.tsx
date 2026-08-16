"use client";

import { useEffect, useRef } from "react";

interface AdProps {
  // Pass your specific ad unit slot ID when calling <Ad slot="1234567890" />
  slot: string; 
}

export default function Ad({ slot }: AdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Prevent pushing the ad multiple times if it's already filled
      if (adRef.current && !adRef.current.hasAttribute("data-ad-status")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className="my-6 flex w-full justify-center overflow-hidden">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: "600px" }}
        data-ad-client="ca-pub-8375393366608206" 
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}