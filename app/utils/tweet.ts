/** Accept status links only; discard tracking queries and photo/video suffixes. */
export function getTweetUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !/^(www\.|mobile\.)?(x\.com|twitter\.com)$/.test(url.hostname)
    ) {
      return null;
    }
    const match = url.pathname.match(
      /^\/(?:[\w]+\/status|i\/web\/status)\/(\d+)(?:\/(?:photo|video)\/\d+)?\/?$/,
    );
    return match ? `https://x.com/i/web/status/${match[1]}` : null;
  } catch {
    return null;
  }
}
