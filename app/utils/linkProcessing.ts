export function replaceHnLinksWithReader(html: string): string {
  if (!html) return html;
  
  // Replace HN item links with reader links
  // Matches patterns like:
  // - https://news.ycombinator.com/item?id=12345
  // - http://news.ycombinator.com/item?id=12345
  // - https://news.ycombinator.com/item?id=12345&other=param
  // - https://news.ycombinator.com/item?id=12345#comment
  
  // Add debugging to see if function is being called
  const result = html.replace(
    /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)(?:[&?#][^"\s<>]*)?/g,
    'https://hn.joncallahan.com/item/$1'
  );
  
  // Log when we find and replace HN links (only in development)
  if (typeof window !== 'undefined' && html !== result) {
    console.log('HN link replacement:', { original: html, replaced: result });
  }
  
  return result;
}