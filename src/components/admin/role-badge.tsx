import { ShieldCheck, ShieldOff } from "lucide-react";

export function RoleBadge({ role, showIcon = false }: { role: string; showIcon?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider uppercase"
      style={
        role === "admin"
          ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
          : { background: "rgba(75,85,99,0.3)", color: "#6b7280", border: "1px solid rgba(75,85,99,0.4)" }
      }
    >
      {showIcon && (role === "admin" ? <ShieldCheck size={9} /> : <ShieldOff size={9} />)}
      {role}
    </span>
  );
}
