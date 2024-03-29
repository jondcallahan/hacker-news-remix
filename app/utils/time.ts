const formatter = new Intl.RelativeTimeFormat("en-us", { numeric: "auto" });

export function getRelativeTimeString(date: Date | number): string {
  const time = typeof date === "number" ? date : date.getTime();
  const deltaSeconds = Math.round((time - Date.now()) / 1000);
  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Infinity,
  ];
  const units: Intl.RelativeTimeFormatUnit[] = [
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year",
  ];
  const unitIndex = cutoffs.findIndex(
    (cutoff) => cutoff > Math.abs(deltaSeconds)
  );
  const divider = unitIndex ? cutoffs[unitIndex - 1] : 1;
  return formatter.format(Math.floor(deltaSeconds / divider), units[unitIndex]);
}

export function formatDate(date: Date, lang = "en-us"): string {
  return new Intl.DateTimeFormat(lang, {
    timeStyle: "short",
    dateStyle: "long",
  }).format(date);
}

export function getTimeZoneFromCookie(cookies: string): string | undefined {
  const match = cookies.match(/time_zone=([^;]+)/);
  return match ? match[1] : undefined;
}
