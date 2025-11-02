import type { LoaderFunctionArgs } from "react-router";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";

// Minimal full-bleed image tile
function tileHtml(src: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden}
    img{width:100%;height:100%;object-fit:cover;display:block}
  </style>
</head>
<body>
  <img src="${src}" alt="Preview"/>
</body>
</html>`.trim();
}

// Fallback: HN-style placeholder
function fallbackHtml(domain: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <style>
    *{margin:0;padding:0}
    html,body{width:100%;height:100%;overflow:hidden}
    .placeholder{width:100%;height:100%;background:#ff6600;color:white;display:flex;align-items:center;justify-content:center;font:bold 32px sans-serif;flex-direction:column;gap:8px}
    .domain{font-size:16px;font-weight:normal;opacity:0.9}
  </style>
</head>
<body>
  <div class="placeholder">
    <div>HN</div>
    <div class="domain">${domain}</div>
  </div>
</body>
</html>`.trim();
}

export async function loader({ request }: LoaderFunctionArgs) {
	const { searchParams } = new URL(request.url);
	const url = searchParams.get("url");

	if (!url) return new Response("Missing url parameter", { status: 400 });

	const targetUrl = new URL(url);
	let ogImageUrl: string | null = null;

	try {
		// Fetch with timeout
		const response = await fetch(targetUrl, {
			headers: { "User-Agent": "HN-Preview-Bot/1.0" },
			signal: AbortSignal.timeout(5000),
		});

		if (!response.ok || !response.body) {
			return new Response(fallbackHtml(targetUrl.hostname), {
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
				},
			});
		}

		// Extract og:image using streaming HTMLRewriter
		const imgUrls: Record<string, string> = {
			"og:image": "",
			"og:image:url": "",
			"twitter:image": "",
			"twitter:image:src": "",
		};

		const rewriter = new HTMLRewriter().on("meta[property], meta[name]", {
			element(el) {
				const property = el.getAttribute("property") || el.getAttribute("name");
				let content = el.getAttribute("content");

				if (property && content && property in imgUrls) {
					// Handle relative URLs
					if (!content.startsWith("http")) {
						content = new URL(content, url).href;
					}
					imgUrls[property] = content;
				}
			},
		});

		// Transform response to extract meta tags
		// Note: HTMLRewriter processes the stream but we need to consume it
		const transformed = rewriter.transform(response);

		// Read the transformed response to trigger HTMLRewriter processing
		// We discard the transformed HTML since we only need the extracted data
		await transformed.arrayBuffer();

		// Get the first available image URL
		ogImageUrl =
			imgUrls["og:image"] ||
			imgUrls["og:image:url"] ||
			imgUrls["twitter:image"] ||
			imgUrls["twitter:image:src"] ||
			null;
	} catch (error) {
		console.error(`Failed to fetch og:image from ${url}:`, error);
		return new Response(fallbackHtml(targetUrl.hostname), {
			headers: {
				"Content-Type": "text/html",
				"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
			},
		});
	}

	// Return the image tile or fallback
	const html = ogImageUrl ? tileHtml(ogImageUrl) : fallbackHtml(targetUrl.hostname);

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
			"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
		},
	});
}
