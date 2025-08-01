export function replaceHnLinksWithReader(html: string): string {
  if (!html) return html;
  
  // Replace HN item links with reader links
  // Matches patterns like:
  // - https://news.ycombinator.com/item?id=12345
  // - http://news.ycombinator.com/item?id=12345
  return html.replace(
    /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/g,
    'https://hn.joncallahan.com/item/$1'
  );
}