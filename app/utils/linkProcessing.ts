export function replaceHnLinksWithReader(html: string): string {
  if (!html) return html;
  
  // Replace HN item links with reader links
  // Matches patterns like:
  // - https://news.ycombinator.com/item?id=12345
  // - http://news.ycombinator.com/item?id=12345
  // - https://news.ycombinator.com/item?id=12345&other=param
  // - https://news.ycombinator.com/item?id=12345#comment
  return html.replace(
    /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)(?:[&?#][^"\s<>]*)?/g,
    'https://hn.joncallahan.com/item/$1'
  );
}