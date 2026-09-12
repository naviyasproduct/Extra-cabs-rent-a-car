import { ImageResponse } from "next/og";

/**
 * Browser tab icon. Brand red with a white E, matching the mark in
 * components/layout/Logo.tsx. Colour is written literally because Satori
 * cannot read the stylesheet, but it is the --color-brand token value and has
 * to be changed with it.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ff5151",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        E
      </div>
    ),
    size,
  );
}
