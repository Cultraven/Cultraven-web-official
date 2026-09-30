import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "var(--color-navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            color: "var(--color-cream)",
            fontWeight: 900,
            fontSize: "18px",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
