import type { Goal } from "@/types";

const GOAL_STYLES: Record<Goal, { bg: string; color: string }> = {
  Brand: { bg: "#EFECFB", color: "#4B43A1" },
  Lead: { bg: "#FBE5DB", color: "#A63B17" },
  Hybrid: { bg: "#E0F3EB", color: "#0F6E50" },
};

export function GoalBadge({ goal }: { goal: Goal }) {
  const style = GOAL_STYLES[goal] ?? GOAL_STYLES.Brand;
  return (
    <span
      className="inline-block text-[12px] font-medium rounded-lg"
      style={{
        padding: "4px 10px",
        background: style.bg,
        color: style.color,
      }}
    >
      {goal}
    </span>
  );
}

export const GOAL_COLORS: Record<Goal, string> = {
  Brand: "#7F77DD",
  Lead: "#D85A30",
  Hybrid: "#1D9E75",
};
