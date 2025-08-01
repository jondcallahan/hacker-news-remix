export function replaceHnLinksWithReader(html: string): string {
  // Always log that function is being called (for debugging)
  if (typeof window !== 'undefined') {
    console.log('replaceHnLinksWithReader called with:', html);
  }
  
  if (!html) return html;
  
  // Replace HN item links with reader links
  // Matches patterns like:
  // - https://news.ycombinator.com/item?id=12345
  // - http://news.ycombinator.com/item?id=12345
  // - https://news.ycombinator.com/item?id=12345&other=param
  // - https://news.ycombinator.com/item?id=12345#comment
  
  const result = html.replace(
    /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)(?:[&?#][^"\s<>]*)?/g,
    'https://hn.joncallahan.com/item/$1'
  );
  
  // Log the result always (for debugging)
  if (typeof window !== 'undefined') {
    console.log('replaceHnLinksWithReader result:', result);
    if (html !== result) {
      console.log('🎯 HN LINK REPLACED!', { original: html, replaced: result });
    }
  }
  
  return result;
}