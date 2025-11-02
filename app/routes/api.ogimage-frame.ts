import type { LoaderFunctionArgs } from "react-router";
import { getOgImageUrlFromUrl } from "~/utils/api.server";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";

// Render image using background-image (matches original UI)
function tileHtml(src: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
</head>
<body style="margin:0;padding:0;">
  <div style="min-height:100cqh;height:100%;width:100%;background-image:url(${src});background-size:cover;background-position:center;"></div>
</body>
</html>`.trim();
}

// Fallback using shared utility (matches original UI)
function fallbackHtml(domain: string): string {
	const svg = getOGImagePlaceholderContent(domain);
	const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
	return tileHtml(dataUrl);
}

export async function loader({ request }: LoaderFunctionArgs) {
	const { searchParams } = new URL(request.url);
	const url = searchParams.get("url");

	if (!url) return new Response("Missing url parameter", { status: 400 });

	const targetUrl = new URL(url);

	// Use shared streaming extraction utility
	const ogImageUrl = await getOgImageUrlFromUrl(url);

	// Return the image tile or fallback
	const html = ogImageUrl ? tileHtml(ogImageUrl) : fallbackHtml(targetUrl.hostname);

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
			"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
		},
	});
}
