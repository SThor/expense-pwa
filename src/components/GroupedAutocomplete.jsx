import React, { useState, useRef, useEffect } from "react";
import { MdAddCircle, MdArrowDropDown  } from "react-icons/md";

export default function GroupedAutocomplete({
  value,
  onChange,
  groupedItems,
  placeholder = "",
  onCreate
}) {
  const [input, setInput] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState({ groupIdx: 0, itemIdx: 0 });
  const inputRef = useRef();
  const dropdownRef = useRef();

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("mousedown", handleClick);
    }
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Filter and flatten for navigation/highlighting
  const filteredGroups = groupedItems
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(input.toLowerCase())
      ),
    }))
    .filter(group => group.items.length > 0);

  const flatList = filteredGroups
    .map((group, groupIdx) =>
      group.items.map((item, itemIdx) => ({ ...item, groupIdx, itemIdx, groupLabel: group.label }))
    )
    .flat();

  // Handle select
  const handleSelect = item => {
    setInput(item.label);
    onChange && onChange(item.label, item);
    setOpen(false);
  };

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    const total = flatList.length;
    let idx = flatList.findIndex(
      item => item.groupIdx === highlighted.groupIdx && item.itemIdx === highlighted.itemIdx
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total === 0) return;
      idx = (idx + 1) % total;
      setHighlighted({ groupIdx: flatList[idx].groupIdx, itemIdx: flatList[idx].itemIdx });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total === 0) return;
      idx = (idx - 1 + total) % total;
      setHighlighted({ groupIdx: flatList[idx].groupIdx, itemIdx: flatList[idx].itemIdx });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[idx]) {
        handleSelect(flatList[idx]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (input !== "") setOpen(true);
  }, [input]);

  // Blur closes dropdown
  function handleBlur(e) {
    setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative w-full" style={{ fontFamily: "inherit" }}>
      <div className="relative">
        <input
          ref={inputRef}
          className="border w-full rounded py-2 px-3 pr-8 text-base shadow-sm focus:ring-2 focus:ring-blue-200 outline-none transition"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            onChange && onChange(e.target.value, null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {/* Arrow icon */}
        <MdArrowDropDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={24}
        />
      </div>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-20 w-full bg-white border rounded shadow-lg mt-1 max-h-72 overflow-auto animate-fade-in"
          style={{
            minWidth: "100%",
            marginTop: 2,
            transition: "box-shadow 0.2s",
          }}
        >
          {onCreate && input && !flatList.some(item => item.label === input) && (
            <div
              className="cursor-pointer px-3 py-2 hover:bg-blue-50 text-blue-700 flex items-center"
              onClick={e => {
                e.preventDefault();
                onCreate(input);
                setOpen(false);
              }}
            >
              <MdAddCircle className="text-xl mr-2 text-blue-600" />
              Create "{input}" {placeholder}
            </div>
          )}
          {filteredGroups.length === 0 && (
            <div className="px-3 py-2 text-gray-400">No matches</div>
          )}
          {filteredGroups.map((group, groupIdx) => (
            <div key={group.label}>
              <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500">
                {group.label}
              </div>
              {group.items.map((item, itemIdx) => (
                <div
                  key={item.value}
                  className={`px-3 py-2 cursor-pointer transition ${
                    highlighted.groupIdx === groupIdx && highlighted.itemIdx === itemIdx
                      ? "bg-blue-100"
                      : "hover:bg-blue-50"
                  }`}
                  onClick={e => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  onMouseEnter={() => setHighlighted({ groupIdx, itemIdx })}
                >
                  {item.label}
                  {item.extra && <span className="float-right text-xs">{item.extra}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.15s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}