export interface KnownService {
  name: string;
  logo: string; // emoji or icon identifier
  defaultCategory: string;
  defaultCycle: "weekly" | "monthly" | "yearly";
}

export const KNOWN_SERVICES: KnownService[] = [
  { name: "Netflix", logo: "🎬", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Spotify", logo: "🎵", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "YouTube Premium", logo: "▶️", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Apple One", logo: "🍎", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "iCloud", logo: "☁️", defaultCategory: "bills", defaultCycle: "monthly" },
  { name: "Adobe CC", logo: "🎨", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Notion", logo: "📝", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "ChatGPT Plus", logo: "🤖", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Google One", logo: "🔵", defaultCategory: "bills", defaultCycle: "monthly" },
  { name: "Disney+", logo: "🏰", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "HBO Max", logo: "🎭", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Canva Pro", logo: "🖼️", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "GitHub Pro", logo: "🐙", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Figma", logo: "✏️", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Slack", logo: "💬", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Zoom", logo: "📹", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Dropbox", logo: "📦", defaultCategory: "bills", defaultCycle: "monthly" },
  { name: "Microsoft 365", logo: "📊", defaultCategory: "work", defaultCycle: "yearly" },
  { name: "Amazon Prime", logo: "📦", defaultCategory: "entertainment", defaultCycle: "yearly" },
  { name: "Apple Music", logo: "🎶", defaultCategory: "entertainment", defaultCycle: "monthly" },
  { name: "Duolingo Plus", logo: "🦉", defaultCategory: "education", defaultCycle: "yearly" },
  { name: "Claude Pro", logo: "🧠", defaultCategory: "work", defaultCycle: "monthly" },
  { name: "Gym", logo: "💪", defaultCategory: "health", defaultCycle: "monthly" },
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