export function SlotBadges({ 
  slot, 
  rentedSlots = "",
  variant = "purple",
  className = "" 
}: { 
  slot?: string; 
  rentedSlots?: string;
  variant?: "purple" | "yellow";
  className?: string; 
}) {
  if (!slot) return null;
  const slots = slot.split(",").map((s) => s.trim()).filter(Boolean);
  const rented = rentedSlots.split(",").map((s) => s.trim()).filter(Boolean);
  
  if (slots.length === 0) return null;

  const bgClass = variant === "yellow" ? "bg-neo-yellow" : "bg-neo-purple";

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {slots.map((s, i) => {
        const isRented = rented.includes(s);
        return (
          <span
            key={i}
            className={`relative border-2 border-black ${isRented ? 'bg-gray-200 text-gray-500' : bgClass} text-black px-2 py-0.5 text-xs font-black shadow-xs inline-flex items-center overflow-hidden`}
            title={isRented ? "Currently Rented Out" : "Available"}
          >
            {isRented && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-[120%] h-[3px] bg-red-600 -rotate-12 absolute z-10 border-y border-black"></span>
              </span>
            )}
            <span className={isRented ? "opacity-50" : ""}>{s}</span>
          </span>
        );
      })}
    </div>
  );
}
