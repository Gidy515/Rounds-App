import { FC } from "react";

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = 24, color = "#7C3AED" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      strokeOpacity="0.2"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
