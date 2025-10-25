import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { MdAddCircle, MdArrowDropDown, MdClear } from "react-icons/md";

import { AUTOCOMPLETE_BLUR_TIMEOUT_MS } from "../constants.js";

function GroupedAutocomplete({
  value,
  onChange,
  groupedItems,
  placeholder = "",
  onCreate,
  placement = "bottom", // "bottom" | "top" | "auto"
}) {
  const [input, setInput] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState({ groupIdx: 0, itemIdx: 0 });
  const inputRef = useRef();
  const dropdownRef = useRef();
  const ignoreBlurRef = useRef(false);
  const userFocusRef = useRef(false);
  const userInputRef = useRef(false);
  const justClearedRef = useRef(false);
  const [openUp, setOpenUp] = useState(placement === "top");

  useEffect(() => {
    setInput(value || "");
  }, [value]);

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

  // Auto placement calculation (when placement === "auto")
  useEffect(() => {
    if (!open) return;

    const desiredHeightPx = 288; // ~max-h-72 (18rem)

    const measure = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const vv = window.visualViewport;
      const viewportTop = vv ? vv.offsetTop : 0;
      const viewportHeight = vv ? vv.height : window.innerHeight;
      const viewportBottom = viewportTop + viewportHeight;

      const spaceBelow = viewportBottom - rect.bottom;
      const spaceAbove = rect.top - viewportTop;

      let shouldOpenUp = false;
      if (placement === "top") shouldOpenUp = true;
      else if (placement === "bottom") shouldOpenUp = false;
      else {
        // auto
        if (spaceBelow >= desiredHeightPx) shouldOpenUp = false;
        else if (spaceAbove >= desiredHeightPx) shouldOpenUp = true;
        else shouldOpenUp = spaceAbove > spaceBelow; // pick the larger side
      }
      setOpenUp(shouldOpenUp);
    };

    // Measure now and on viewport changes
    measure();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);
    return () => {
      vv?.removeEventListener("resize", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open, placement, input]);

  // Filter and flatten for navigation/highlighting
  const filteredGroups = groupedItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(input.toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const flatList = filteredGroups
    .map((group, groupIdx) =>
      group.items.map((item, itemIdx) => ({
        ...item,
        groupIdx,
        itemIdx,
        groupLabel: group.label,
      })),
    )
    .flat();

  const handleSelect = (item) => {
    setInput(item.label);
    onChange(item.label, item.value);
    setOpen(false);
    userInputRef.current = false;
  };

  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    const total = flatList.length;
    let idx = flatList.findIndex(
      (item) =>
        item.groupIdx === highlighted.groupIdx &&
        item.itemIdx === highlighted.itemIdx,
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total === 0) return;
      idx = (idx + 1) % total;
      setHighlighted({
        groupIdx: flatList[idx].groupIdx,
        itemIdx: flatList[idx].itemIdx,
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total === 0) return;
      idx = (idx - 1 + total) % total;
      setHighlighted({
        groupIdx: flatList[idx].groupIdx,
        itemIdx: flatList[idx].itemIdx,
      });
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
  // The timeout allows dropdown click events to register before the input loses focus and closes the dropdown.
  // This prevents race conditions where a click on a dropdown item would be ignored due to blur.
  function handleBlur() {
    setTimeout(() => {
      if (ignoreBlurRef.current) {
        ignoreBlurRef.current = false;
        return;
      }
      setOpen(false);

      if (!input) {
        // Empty input - treat as clear
        onChange("", "");
        return;
      }

      // If the value prop matches the input, do nothing (avoid double-clear)
      if (value === input) {
        return;
      }

      // Find the value that corresponds to the input label
      const matchingItem = flatList.find((item) => item.label === input);
      if (matchingItem) {
        // Exact match found
        onChange(input, matchingItem.value);
      } else if (typeof onCreate === "function") {
        // No match - create new item if allowed
        onCreate(input);
      } else {
        // No match and cannot create: set to empty/null
        onChange("", "");
      }
    }, AUTOCOMPLETE_BLUR_TIMEOUT_MS);
  }

  // Only track user focus for suppressOpen logic
  useEffect(() => {
    const setUserFocus = () => {
      userFocusRef.current = true;
    };
    const input = inputRef.current;
    if (input) {
      input.addEventListener("mousedown", setUserFocus);
      input.addEventListener("touchstart", setUserFocus);
      input.addEventListener("keydown", setUserFocus);
    }
    return () => {
      if (input) {
        input.removeEventListener("mousedown", setUserFocus);
        input.removeEventListener("touchstart", setUserFocus);
        input.removeEventListener("keydown", setUserFocus);
      }
    };
  }, []);
  const handleInputChange = (e) => {
    setInput(e.target.value);
    setOpen(true);
    userInputRef.current = true;
  };

  useEffect(() => {
    if (justClearedRef.current) {
      justClearedRef.current = false;
      return;
    }
    if (!userInputRef.current) {
      setOpen(false);
    }
    userInputRef.current = false;
  }, [input]);

  return (
    <div className="relative w-full font-inherit">
      <div className="relative">
        <input
          ref={inputRef}
          className="input input-bordered w-full px-3 py-2 pr-8 text-base shadow-xs unified-border"
          value={input}
          onChange={handleInputChange}
          onFocus={() => {
            setOpen(true);
            userFocusRef.current = false;
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        <MdArrowDropDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={24}
        />
        {input && (
          <button
            type="button"
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-hidden bg-transparent border-none p-0 m-0 cursor-pointer"
            tabIndex={-1}
            onClick={() => {
              setInput("");
              onChange("", "");
              setOpen(true);
              justClearedRef.current = true;
              setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
              }, 0);
            }}
            aria-label="Clear"
          >
            <MdClear size={20} />
          </button>
        )}
      </div>
      {open && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 z-20 w-full bg-white border border-gray-300 rounded-sm shadow-lg max-h-72 overflow-auto min-w-full transition-shadow duration-200 ${
            openUp ? "bottom-full mb-1 animate-fade-in-up" : "top-full mt-1 animate-fade-in-down"
          }`}
          style={{ maxHeight: "min(18rem, 50dvh)", overscrollBehavior: "contain" }}
          onMouseDown={() => {
            ignoreBlurRef.current = true;
          }}
        >
          {input &&
            !flatList.some((item) => item.label === input) &&
            typeof onCreate === "function" && (
              <div
                className="cursor-pointer px-3 py-2 hover:bg-blue-50 text-blue-700 flex items-center border-b border-b-gray-100 transition-colors duration-150"
                onClick={(e) => {
                  e.preventDefault();
                  onCreate(input);
                  setOpen(false);
                }}
              >
                <MdAddCircle className="text-xl mr-2 text-blue-600" />
                Create &quot;{input}&quot; {placeholder}
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
                  className={`px-3 py-2 cursor-pointer transition-colors duration-150 rounded ${
                    highlighted.groupIdx === groupIdx &&
                    highlighted.itemIdx === itemIdx
                      ? "bg-blue-100"
                      : "hover:bg-blue-50"
                  } mx-1 my-0.5`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  onMouseEnter={() => setHighlighted({ groupIdx, itemIdx })}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.15s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.15s;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

GroupedAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired, // (label: string, value: any) => void
  groupedItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.any.isRequired,
          extra: PropTypes.node,
        }),
      ).isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  onCreate: PropTypes.func, // (input: string) => void, optional. If provided, allows creating new items when no match is found.
  placement: PropTypes.oneOf(["bottom", "top", "auto"]),
};

export default GroupedAutocomplete;
