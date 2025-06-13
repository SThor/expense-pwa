import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import PropTypes from "prop-types";
import { useRef, useEffect, useState } from "react";
import { MdArrowDropDown } from "react-icons/md";

export default function EmojiCategoryButton({ value, onChange }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef();

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClick(e) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [showEmojiPicker]);

  return (
    <div className="relative" style={{ width: "fit-content" }}>
      <button
        type="button"
        className="flex items-center justify-center border rounded bg-white shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition"
        onClick={() => setShowEmojiPicker((v) => !v)}
        aria-label="Pick emoji category"
        style={{ width: 50, height: 40, padding: 2 }}
      >
        <span
          style={{
            fontSize: "1.35em",
            display: "flex",
            verticalAlign: "middle",
            height: "100%",
            width: "100%",
          }}
        >
          {value}
        </span>
        <MdArrowDropDown className="text-gray-400" size={24} />
      </button>
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute z-30 bg-white border rounded shadow-lg mt-1 animate-fade-in"
          style={{ minWidth: 180, maxWidth: 220 }}
        >
          <Picker
            data={data}
            onEmojiSelect={(e) => {
              onChange(e.native || e.id || e.colons || "");
              setShowEmojiPicker(false);
            }}
            theme="light"
          />
        </div>
      )}
    </div>
  );
}

EmojiCategoryButton.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
