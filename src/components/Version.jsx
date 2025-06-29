import PropTypes from "prop-types";

import { getVersionString, getShortVersionString, VERSION_INFO } from "../version.js";

export default function Version({ variant = "short", className = "" }) {
  const getDisplayVersion = () => {
    switch (variant) {
      case "full":
        return getVersionString();
      case "short":
        return getShortVersionString();
      case "branch-commit":
        return `${VERSION_INFO.branch}@${VERSION_INFO.commit}`;
      case "tag-only":
        return VERSION_INFO.tag || getShortVersionString();
      default:
        return getShortVersionString();
    }
  };

  const getTitle = () => {
    const buildDate = new Date(VERSION_INFO.buildTime).toLocaleString();
    return [
      `Version: ${getVersionString()}`,
      `Branch: ${VERSION_INFO.branch}`,
      `Commit: ${VERSION_INFO.commit}`,
      VERSION_INFO.isDirty ? "Working directory: dirty" : "",
      `Built: ${buildDate}`,
    ]
      .filter(Boolean)
      .join("&#10;");
  };

  return (
    <span
      className={`text-xs text-gray-500 font-mono ${className}`}
      title={getTitle()}
    >
      v{getDisplayVersion()}
      {VERSION_INFO.isDirty && "*"}
    </span>
  );
}

Version.propTypes = {
  variant: PropTypes.oneOf(["short", "full", "branch-commit", "tag-only"]),
  className: PropTypes.string,
};
