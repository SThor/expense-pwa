import React from "react";

export default function SuggestedCategoryPill({
  cat,
  group,
  selected,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[1rem] font-medium border flex items-center gap-2 transition-colors duration-150 min-h-[36px] cursor-pointer ${selected ? "bg-blue-200 border-blue-500 text-blue-900" : "bg-gray-100 border-gray-300 text-gray-800"}`}
    >
      <span className="text-gray-600">{group ? group.name : "?"}</span>
      <span className="mx-1">&gt;</span>
      <span className="font-semibold">{cat.name}</span>
    </button>
  );
}
