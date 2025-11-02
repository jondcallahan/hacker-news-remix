import type { LoaderFunctionArgs } from "react-router";

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

// Fallback using original SVG placeholder (matches original UI)
function fallbackHtml(domain: string): string {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='1200' height='600' viewBox='0 0 1200 600'><rect fill='lightgrey' width='1200' height='600'></rect><text dy='22.4' x='50%' y='50%' text-anchor='middle' font-weight='bold' fill='rgba(0,0,0,0.5)' font-size='64' font-family='sans-serif'>${domain}</text></svg>`;
	const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
	return tileHtml(dataUrl);
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
