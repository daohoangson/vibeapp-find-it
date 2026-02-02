import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #e0f2fe, #bae6fd)",
        borderRadius: "24%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Distractor 1 (Top Left) - Unicorn */}
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "40px",
            fontSize: 200,
            opacity: 0.6,
            transform: "rotate(-15deg)",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
          }}
        >
          🦄
        </div>

        {/* Distractor 2 (Bottom Right) - T-Rex */}
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            right: "40px",
            fontSize: 200,
            opacity: 0.6,
            transform: "rotate(15deg) scaleX(-1)",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
          }}
        >
          🦖
        </div>

        {/* Hero (Center) */}
        <div
          style={{
            fontSize: 280,
            // White text-shadow for glow, plus drop-shadow for depth
            textShadow: "0 0 60px white, 0 0 30px white",
            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.2))",
            transform: "scale(1.1)",
          }}
        >
          🧐
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
