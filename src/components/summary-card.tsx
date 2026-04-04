import { memo } from "react";
import { cn } from "@/lib/utils";

export const SummaryCard = memo(function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-amber-400">{value}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
      )}
    </div>
  );
});
SummaryCard.displayName = "SummaryCard";
