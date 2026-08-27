export function SlotBadges({ 
  slot, 
  variant = "purple",
  className = "" 
}: { 
  slot?: string; 
  variant?: "purple" | "yellow";
  className?: string; 
}) {
  if (!slot) return null;
  const slots = slot.split(",").map((s) => s.trim()).filter(Boolean);
  if (slots.length === 0) return null;

  const bgClass = variant === "yellow" ? "bg-neo-yellow" : "bg-neo-purple";

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {slots.map((s, i) => (
        <span
          key={i}
          className={`border-2 border-black ${bgClass} text-black px-2 py-0.5 text-xs font-black shadow-xs inline-flex items-center`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
