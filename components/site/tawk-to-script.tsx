import Script from "next/script";

export function TawkToScript() {
  return (
    <Script id="tawk-to-widget" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();
        (function(){
          var s1 = document.createElement("script");
          var s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = "https://embed.tawk.to/69f8e4381eeb261c3abd895c/1jnq3mvd3";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
