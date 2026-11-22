"use client";

import Snowfall from "react-snowfall";

export default function PortalSnowfall() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[35] overflow-hidden">
      <Snowfall
        color="#dbeafe"
        snowflakeCount={55}
        radius={[0.8, 2.8]}
        speed={[0.5, 1.8]}
        wind={[-0.35, 0.35]}
        opacity={[0.55, 0.75]}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
