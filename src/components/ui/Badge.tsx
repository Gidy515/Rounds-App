import { FC } from "react";
import { formatState } from "@/lib/utils";

interface BadgeProps {
  state: any;
}

export const StateBadge: FC<BadgeProps> = ({ state }) => {
  const key = Object.keys(state)[0];
  const label = formatState(state);

  const classMap: Record<string, string> = {
    open: "badge-open",
    ready: "badge-ready",
    active: "badge-active",
    completed: "badge-completed",
    cancelled: "badge-cancelled",
  };

  const dot: Record<string, string> = {
    open: "#7C3AED",
    ready: "#F59E0B",
    active: "#10B981",
    completed: "#06B6D4",
    cancelled: "#EF4444",
  };

  return (
    <span className={classMap[key] ?? "badge-open"}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: dot[key] ?? "#7C3AED",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
};
