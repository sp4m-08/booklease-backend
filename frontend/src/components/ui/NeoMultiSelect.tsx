"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface NeoMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export function NeoMultiSelect({ value = [], onChange, options, placeholder = "Select options", className = "" }: NeoMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border-4 border-black p-3 font-bold bg-white focus:outline-none shadow-neo transition-all"
      >
        <span className="truncate">{value.length > 0 ? selectedLabels : placeholder}</span>
        <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 border-4 border-black bg-white shadow-neo max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`w-full flex items-center justify-between p-3 font-bold border-b-2 border-black last:border-b-0 hover:bg-neo-yellow transition-colors ${
                  isSelected ? "bg-neo-purple text-black" : "text-gray-800"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(option.value);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={18} className="text-black font-black" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
