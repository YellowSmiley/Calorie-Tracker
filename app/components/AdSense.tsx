// AdSense component for Google AdSense integration
"use client";

import { useEffect } from "react";

export default function AdSense() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3994001555579385";
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
      // Add meta tag for Google AdSense account
      const meta = document.createElement("meta");
      meta.name = "google-adsense-account";
      meta.content = "ca-pub-3994001555579385";
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-3994001555579385"
      data-ad-slot="1234567890"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
