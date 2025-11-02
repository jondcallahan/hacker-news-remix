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

		// Extract og:image using streaming HTMLRewriter with early exit
		const imgUrls: Record<string, string> = {
			"og:image": "",
			"og:image:url": "",
			"twitter:image": "",
			"twitter:image:src": "",
		};

		let foundImage = false;

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

					// Mark that we found an image (prioritize og:image)
					if (property === "og:image" || property === "og:image:url") {
						foundImage = true;
					}
				}
			},
		});

		// Stream chunks and stop early when we find og:image
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		const MAX_CHUNKS = 50; // Limit to ~50KB-200KB of HTML (meta tags are in <head>)
		let chunkCount = 0;

		try {
			while (!foundImage && chunkCount < MAX_CHUNKS) {
				const { done, value } = await reader.read();
				if (done) break;

				chunkCount++;
				buffer += decoder.decode(value, { stream: true });

				// Process accumulated buffer through HTMLRewriter
				// We create a minimal response to satisfy HTMLRewriter's API
				const mockResponse = new Response(buffer);
				const transformed = rewriter.transform(mockResponse);

				// Consume the transformed response to trigger element handlers
				await transformed.arrayBuffer();

				// Early exit if we found og:image
				if (foundImage) {
					break;
				}
			}
		} finally {
			// Cancel the reader to stop downloading
			await reader.cancel();
		}

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
