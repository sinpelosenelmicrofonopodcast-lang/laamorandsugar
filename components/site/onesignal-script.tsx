"use client";

import Script from "next/script";

const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export function OneSignalScript() {
  if (!oneSignalAppId) {
    return null;
  }

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "${oneSignalAppId}",
            });
          });
        `}
      </Script>
    </>
  );
}
