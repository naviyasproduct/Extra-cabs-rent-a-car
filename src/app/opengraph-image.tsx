import { ImageResponse } from "next/og";
import { site } from "@/lib/data/site";

/**
 * The card that appears when the site is shared on WhatsApp, Facebook or a
 * search result preview. Without this, shares show a bare link.
 *
 * ImageResponse renders through Satori, which has no access to the stylesheet,
 * so the token values from globals.css are written out literally here. They are
 * the same colours, not new ones: paper #000000, brand #e01b22, ink #e9edf5.
 */
export const alt = `${site.name}, ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              backgroundColor: "#e01b22",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div
            style={{
              color: "#828d9f",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {`${site.address.city}, Sri Lanka`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#e9edf5",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              color: "#ff5b61",
              fontSize: 40,
              fontWeight: 600,
              marginTop: 20,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 120, height: 6, backgroundColor: "#e01b22" }} />
          <div style={{ color: "#adb7c9", fontSize: 26 }}>
            Self drive, cabs with a driver, airport transfers, wedding cars
          </div>
        </div>
      </div>
    ),
    size,
  );
}
