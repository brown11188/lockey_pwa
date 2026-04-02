export interface KnownService {
  name: string;
  logo: string; // Simple Icons CDN URL or emoji fallback
  defaultCategory: string;
  defaultCycle: "weekly" | "monthly" | "yearly";
}

// Simple Icons CDN — brand SVGs with brand color, dark-theme friendly
// Full list: https://simpleicons.org
const SI = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

export const KNOWN_SERVICES: KnownService[] = [
  { name: "Netflix",          logo: SI("netflix"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Spotify",          logo: SI("spotify"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "YouTube Premium",  logo: SI("youtube"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Apple One",        logo: SI("apple"),         defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "iCloud",           logo: SI("icloud"),        defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Adobe CC",         logo: SI("adobe"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Notion",           logo: SI("notion"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "ChatGPT Plus",     logo: SI("openai"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "ChatGPT",          logo: SI("openai"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Google One",       logo: SI("google"),        defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Disney+",          logo: SI("disneyplus"),    defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "HBO Max",          logo: SI("hbo"),           defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Max",              logo: SI("hbo"),           defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Canva Pro",        logo: SI("canva"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Canva",            logo: SI("canva"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "GitHub",           logo: SI("github"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "GitHub Pro",       logo: SI("github"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Figma",            logo: SI("figma"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Slack",            logo: SI("slack"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Zoom",             logo: SI("zoom"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Dropbox",          logo: SI("dropbox"),       defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Microsoft 365",    logo: SI("microsoft"),     defaultCategory: "work",          defaultCycle: "yearly"  },
  { name: "Amazon Prime",     logo: SI("amazon"),        defaultCategory: "entertainment", defaultCycle: "yearly"  },
  { name: "Apple Music",      logo: SI("applemusic"),    defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Apple TV+",        logo: SI("appletv"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Duolingo Plus",    logo: SI("duolingo"),      defaultCategory: "education",     defaultCycle: "yearly"  },
  { name: "Duolingo",         logo: SI("duolingo"),      defaultCategory: "education",     defaultCycle: "yearly"  },
  { name: "Claude Pro",       logo: SI("anthropic"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Claude",           logo: SI("anthropic"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Anthropic",        logo: SI("anthropic"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Gemini Advanced",  logo: SI("googlegemini"),  defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Copilot Pro",      logo: SI("microsoft"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Linear",           logo: SI("linear"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Vercel",           logo: SI("vercel"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Vercel Pro",       logo: SI("vercel"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "AWS",              logo: SI("amazonaws"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Twitch",           logo: SI("twitch"),        defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Hulu",             logo: SI("hulu"),          defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "NordVPN",          logo: SI("nordvpn"),       defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "ExpressVPN",       logo: SI("expressvpn"),    defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "1Password",        logo: SI("1password"),     defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "LastPass",         logo: SI("lastpass"),      defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "Grammarly",        logo: SI("grammarly"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Loom",             logo: SI("loom"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Miro",             logo: SI("miro"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Jira",             logo: SI("jira"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Confluence",       logo: SI("confluence"),    defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Atlassian",        logo: SI("atlassian"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Trello",           logo: SI("trello"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Asana",            logo: SI("asana"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Monday.com",       logo: SI("monday"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "HubSpot",          logo: SI("hubspot"),       defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Salesforce",       logo: SI("salesforce"),    defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Gym",              logo: "💪",                defaultCategory: "health",        defaultCycle: "monthly" },
];

export function findKnownService(name: string): KnownService | undefined {
  const lower = name.toLowerCase().trim();
  return KNOWN_SERVICES.find(
    (s) => s.name.toLowerCase() === lower || s.name.toLowerCase().startsWith(lower)
  );
}

export function searchKnownServices(query: string): KnownService[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase().trim();
  return KNOWN_SERVICES.filter(
    (s) => s.name.toLowerCase().includes(lower)
  ).slice(0, 5);
}
