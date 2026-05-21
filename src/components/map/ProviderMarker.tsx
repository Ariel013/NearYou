"use client";

// This component generates Leaflet DivIcon HTML for provider markers.
// It is used inside MapView (which is dynamically imported with ssr:false).

export interface ProviderMarkerOptions {
  initial: string;
  isSelected?: boolean;
}

export function getProviderMarkerHtml({ initial, isSelected = false }: ProviderMarkerOptions): string {
  const bg = isSelected ? "#0D4E7A" : "#1B6CA8";
  const size = isSelected ? 40 : 32;
  const border = isSelected ? "3px solid #F5A623" : "2px solid white";

  return `<div style="
    width:${size}px;
    height:${size}px;
    border-radius:50%;
    background:${bg};
    display:flex;
    align-items:center;
    justify-content:center;
    color:white;
    font-size:${isSelected ? 15 : 13}px;
    font-weight:700;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    border:${border};
    cursor:pointer;
    transition:transform 150ms ease;
    font-family:system-ui,sans-serif;
  ">${initial}</div>`;
}

export function getUserMarkerHtml(): string {
  return `<div style="
    width:16px;
    height:16px;
    border-radius:50%;
    background:#1B6CA8;
    border:3px solid white;
    box-shadow:0 0 0 4px rgba(27,108,168,0.25);
  "></div>`;
}
