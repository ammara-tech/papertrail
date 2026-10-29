"use client";

import { useEffect, useState } from "react";
import { centsToInput, parseRand } from "@/lib/money";

/*
  A price box that accepts "1250", "1250,50" or "R 1 250.50".
  It keeps what you type while you type, and tidies it when you leave the box.
*/
export default function PriceInput({ cents, onChange, label, className = "" }: { cents: number; onChange: (cents: number) => void; label: string; className?: string }) {
  const [text, setText] = useState(cents ? centsToInput(cents) : "");

  // If the price changes somewhere else (e.g. Duplicate), show the new one
  useEffect(() => {
    setText((current) => (parseRand(current) === cents ? current : cents ? centsToInput(cents) : ""));
  }, [cents]);

  return (
    <input
      inputMode="decimal"
      aria-label={label}
      value={text}
      placeholder="0.00"
      onChange={(e) => {
        setText(e.target.value);
        const value = parseRand(e.target.value);
        if (value !== null) onChange(value);
        if (e.target.value.trim() === "") onChange(0);
      }}
      onBlur={() => setText(cents ? centsToInput(cents) : "")}
      className={className}
    />
  );
}
