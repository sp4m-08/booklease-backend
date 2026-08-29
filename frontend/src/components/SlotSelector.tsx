"use client";

import { VIT_SLOTS } from "@/lib/constants";
import { Check, CheckCheck, RotateCcw } from "lucide-react";

// The discrete VIT exam slots (excluding "All Slots" from the pills grid, handled by Select All)
export const VIT_INDIVIDUAL_SLOTS = [
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "G1", "G2"
] as const;

interface SlotSelectorProps {
  selectedSlots: string[];
  onChange: (slots: string[]) => void;
  label?: string;
}

export function SlotSelector({ selectedSlots, onChange, label = "Applicable Exam Slots" }: SlotSelectorProps) {
  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      onChange(selectedSlots.filter((s) => s !== slot));
    } else {
      onChange([...selectedSlots, slot]);
    }
  };

  const selectAll = () => {
    onChange([...VIT_INDIVIDUAL_SLOTS]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const isAllSelected = VIT_INDIVIDUAL_SLOTS.every((s) => selectedSlots.includes(s));

  return (
    <div className="space-y-2 bg-white/90 border-4 border-black p-4 shadow-neo">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-black pb-2">
        <div>
          <label className="font-bold text-base block text-black">
            {label} <span className="text-xs font-normal text-gray-700">(Select multiple)</span>
          </label>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 text-xs font-black">
          <button
            type="button"
            onClick={selectAll}
            className={`border-2 border-black px-2.5 py-1 transition-all flex items-center gap-1 ${
              isAllSelected ? "bg-neo-green shadow-sm" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <CheckCheck size={14} /> {isAllSelected ? "All Selected" : "Select All"}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="border-2 border-black px-2.5 py-1 bg-gray-100 hover:bg-gray-200 transition-all flex items-center gap-1"
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
        {VIT_INDIVIDUAL_SLOTS.map((slot) => {
          const isSelected = selectedSlots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => toggleSlot(slot)}
              className={`border-2 border-black py-2 px-2 font-black text-sm transition-all flex items-center justify-center gap-1.5 ${
                isSelected
                  ? "bg-neo-yellow shadow-neo -translate-y-0.5"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {isSelected && <Check size={14} className="stroke-[3]" />}
              {slot}
            </button>
          );
        })}
      </div>

      {/* Selected summary */}
      <div className="pt-2 text-xs font-bold text-gray-700 flex justify-between items-center">
        <span>
          {selectedSlots.length === 0
            ? "⚠️ No slots selected (Will be listed for general/any slot)"
            : isAllSelected
            ? "✨ Applicable for all exam slots (A1-G2)"
            : `✓ Selected ${selectedSlots.length} slot${selectedSlots.length > 1 ? "s" : ""}: ${selectedSlots.join(", ")}`}
        </span>
      </div>
    </div>
  );
}
