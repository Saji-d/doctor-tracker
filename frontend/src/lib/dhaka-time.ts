// The dashboard's greeting and date are a Bangladesh-facing product
// requirement, not a "wherever the browser happens to be" one — so they're
// computed against the Asia/Dhaka timezone explicitly, via Intl, rather than
// the visitor's (or server's) local timezone.
const DHAKA_TIME_ZONE = "Asia/Dhaka";

export type Daypart = "morning" | "afternoon" | "evening" | "night";

/** The current hour (0-23) in Asia/Dhaka for the given instant. */
export function getDhakaHour(date: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return parseInt(formatted, 10);
}

// 05:00-11:59 morning, 12:00-16:59 afternoon, 17:00-19:59 evening,
// 20:00-04:59 night (wraps past midnight).
export function getDaypart(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function getDhakaDaypart(date: Date): Daypart {
  return getDaypart(getDhakaHour(date));
}

const DAYPART_GREETING: Record<Daypart, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Good night",
};

export function getDhakaGreeting(date: Date): string {
  return DAYPART_GREETING[getDhakaDaypart(date)];
}

/** The current calendar date in Asia/Dhaka, formatted for display. */
export function formatDhakaDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
