const defaultDeepLink = "idnight://auth/complete";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deepLinkTarget = buildDeepLinkTarget(url);
  const escapedDeepLinkTarget = escapeHtml(deepLinkTarget);

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Abriendo ID-Night…</title>
    <style>
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111827; color: #f9fafb; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { max-width: 480px; width: 100%; background: #1f2937; border-radius: 16px; padding: 24px; box-shadow: 0 20px 45px rgba(0,0,0,.3); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0 0 16px; line-height: 1.6; color: #d1d5db; }
      a { display: inline-block; padding: 12px 18px; border-radius: 10px; background: #4f46e5; color: white; text-decoration: none; font-weight: 600; }
      code { word-break: break-all; color: #c7d2fe; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Abriendo la app…</h1>
        <p>Si ID-Night está instalada, este enlace debería abrir la app y completar la verificación.</p>
        <p>Si no se abre automáticamente, tocá este botón:</p>
        <p><a href="${escapedDeepLinkTarget}">Abrir ID-Night</a></p>
        <p>Si seguís con problemas, copiá este enlace dentro del mismo dispositivo:</p>
        <p><code>${escapedDeepLinkTarget}</code></p>
      </section>
    </main>
    <script>
      window.location.replace(${JSON.stringify(deepLinkTarget)});
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function buildDeepLinkTarget(requestUrl: URL) {
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.trim() || defaultDeepLink;
  const deepLink = new URL(redirectTo);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    if (key === "redirect_to") continue;
    deepLink.searchParams.set(key, value);
  }

  return deepLink.toString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
