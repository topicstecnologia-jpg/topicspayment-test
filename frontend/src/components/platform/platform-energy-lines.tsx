import type { CSSProperties } from "react";

const energyLines = [
  { left: "8%", duration: "10.5s", delay: "-2s", height: "220px", opacity: "0.52" },
  { left: "17%", duration: "9.2s", delay: "-6.5s", height: "180px", opacity: "0.38" },
  { left: "29%", duration: "11.1s", delay: "-3.2s", height: "240px", opacity: "0.46" },
  { left: "43%", duration: "9.8s", delay: "-8.7s", height: "200px", opacity: "0.42" },
  { left: "58%", duration: "11.4s", delay: "-5.4s", height: "260px", opacity: "0.5" },
  { left: "71%", duration: "8.8s", delay: "-7.1s", height: "170px", opacity: "0.36" },
  { left: "83%", duration: "10.8s", delay: "-2.6s", height: "230px", opacity: "0.44" },
  { left: "92%", duration: "9.4s", delay: "-8.4s", height: "190px", opacity: "0.38" }
] as const;

type EnergyLineStyle = CSSProperties & {
  "--energy-left": string;
  "--energy-duration": string;
  "--energy-delay": string;
  "--energy-height": string;
  "--energy-opacity": string;
};

function getEnergyLineStyle(line: (typeof energyLines)[number]): EnergyLineStyle {
  return {
    "--energy-left": line.left,
    "--energy-duration": line.duration,
    "--energy-delay": line.delay,
    "--energy-height": line.height,
    "--energy-opacity": line.opacity
  };
}

export function PlatformEnergyLines() {
  return (
    <div className="platform-energy-lines" aria-hidden="true">
      {energyLines.map((line) => (
        <span
          key={line.left}
          className="platform-energy-line"
          style={getEnergyLineStyle(line)}
        />
      ))}
    </div>
  );
}
