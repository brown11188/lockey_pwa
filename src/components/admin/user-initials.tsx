import { cn } from "@/lib/utils";

function getInitials(name: string | null, email: string): string {
  const text = name ?? email;
  return text
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function UserInitials({
  name,
  email,
  size = "sm",
  className,
}: {
  name: string | null;
  email: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const chars = getInitials(name, email);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-gray-950",
        size === "sm" ? "h-8 w-8 rounded-full text-xs" : "h-14 w-14 rounded-2xl text-lg",
        className,
      )}
      style={{ background: "#f59e0b" }}
    >
      {chars}
    </div>
  );
}
