import PropTypes from "prop-types";

export default function EuroLoadingSpinner({
  size = "w-8 h-8",
  className = "",
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${size}`}>
        {/* Euro symbol with animated stroke */}
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          {/* Define the stroke animation */}
          <defs>
            <style>
              {`
                .euro-path {
                  stroke-dasharray: 100;
                  stroke-dashoffset: 100;
                  animation: drawPath 2s ease-in-out infinite;
                }
                .euro-path-1 {
                  animation-delay: 0s;
                }
                .euro-path-2 {
                  animation-delay: 0.2s;
                }
                .euro-path-3 {
                  animation-delay: 0.4s;
                }
                .euro-path-4 {
                  animation-delay: 0.6s;
                }
                @keyframes drawPath {
                  0% {
                    stroke-dashoffset: 100;
                    stroke-width: 1;
                    stroke: rgb(14 165 233);
                  }
                  50% {
                    stroke-dashoffset: 0;
                    stroke-width: 2;
                    stroke: rgb(2 132 199);
                  }
                  100% {
                    stroke-dashoffset: -100;
                    stroke-width: 1;
                    stroke: rgb(14 165 233);
                  }
                }
              `}
            </style>
          </defs>

          {/* Euro symbol paths with sequential animation */}

          {/* Static background "rail" paths - faint version */}
          <g className="opacity-20" transform="scale(0.85) translate(1.8, 1.8)">
            <path
              d="M18 7c0-5.333-8-5.333-8 0"
              stroke="rgb(14 165 233)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10 7v10c0 5.333 8 5.333 8 0"
              stroke="rgb(14 165 233)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M6 10h8"
              stroke="rgb(14 165 233)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M6 14h8"
              stroke="rgb(14 165 233)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Animated foreground paths */}
          <g transform="scale(0.85) translate(1.8, 1.8)">
            <path
              d="M18 7c0-5.333-8-5.333-8 0"
              className="euro-path euro-path-1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10 7v10c0 5.333 8 5.333 8 0"
              className="euro-path euro-path-2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M6 10h8"
              className="euro-path euro-path-3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M6 14h8"
              className="euro-path euro-path-4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </svg>

        {/* Simple static outer ring */}
        <div className="absolute inset-0">
          <svg className="w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r="47%"
              fill="none"
              stroke="rgb(14 165 233)"
              strokeWidth="1.5"
              opacity="0.2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

EuroLoadingSpinner.propTypes = {
  size: PropTypes.string,
  className: PropTypes.string,
};
