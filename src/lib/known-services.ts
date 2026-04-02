export interface KnownService {
  name: string;
  logo: string; // URL or emoji fallback
  defaultCategory: string;
  defaultCycle: "weekly" | "monthly" | "yearly";
}

// Uses Clearbit Logo API for high-quality brand logos
const L = (domain: string) => `https://logo.clearbit.com/${domain}`;

export const KNOWN_SERVICES: KnownService[] = [
  { name: "Netflix",          logo: L("netflix.com"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Spotify",          logo: L("spotify.com"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "YouTube Premium",  logo: L("youtube.com"),       defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Apple One",        logo: L("apple.com"),         defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "iCloud",           logo: L("icloud.com"),        defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Adobe CC",         logo: L("adobe.com"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Notion",           logo: L("notion.so"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "ChatGPT Plus",     logo: L("openai.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Google One",       logo: L("google.com"),        defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Disney+",          logo: L("disneyplus.com"),    defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "HBO Max",          logo: L("hbo.com"),           defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Canva Pro",        logo: L("canva.com"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "GitHub",           logo: L("github.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "GitHub Pro",       logo: L("github.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Figma",            logo: L("figma.com"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Slack",            logo: L("slack.com"),         defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Zoom",             logo: L("zoom.us"),           defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Dropbox",          logo: L("dropbox.com"),       defaultCategory: "bills",         defaultCycle: "monthly" },
  { name: "Microsoft 365",    logo: L("microsoft.com"),     defaultCategory: "work",          defaultCycle: "yearly"  },
  { name: "Amazon Prime",     logo: L("amazon.com"),        defaultCategory: "entertainment", defaultCycle: "yearly"  },
  { name: "Apple Music",      logo: L("apple.com"),         defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Duolingo Plus",    logo: L("duolingo.com"),      defaultCategory: "education",     defaultCycle: "yearly"  },
  { name: "Claude Pro",       logo: L("anthropic.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Claude",           logo: L("anthropic.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Anthropic",        logo: L("anthropic.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Gemini Advanced",  logo: L("google.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Copilot Pro",      logo: L("microsoft.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Linear",           logo: L("linear.app"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Vercel Pro",       logo: L("vercel.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Vercel",           logo: L("vercel.com"),        defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "AWS",              logo: L("aws.amazon.com"),    defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Twitch",           logo: L("twitch.tv"),         defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Hulu",             logo: L("hulu.com"),          defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Apple TV+",        logo: L("apple.com"),         defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "NordVPN",          logo: L("nordvpn.com"),       defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "ExpressVPN",       logo: L("expressvpn.com"),    defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "1Password",        logo: L("1password.com"),     defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "LastPass",         logo: L("lastpass.com"),      defaultCategory: "bills",         defaultCycle: "yearly"  },
  { name: "Grammarly",        logo: L("grammarly.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Loom",             logo: L("loom.com"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Jira",             logo: L("atlassian.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Confluence",       logo: L("atlassian.com"),     defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Miro",             logo: L("miro.com"),          defaultCategory: "work",          defaultCycle: "monthly" },
  { name: "Gym",              logo: "💪",                   defaultCategory: "health",        defaultCycle: "monthly" },
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
