export function getBaseContext(): string {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  return `Current Date: ${dateFormatter.format(now)}
Timezone: ${timezone}
Note: Use this context for date-related queries like "today", "this week", "this month", etc.`;
}

export function withBaseContext(systemPrompt: string): string {
  return `${systemPrompt}

---

${getBaseContext()}`;
}
