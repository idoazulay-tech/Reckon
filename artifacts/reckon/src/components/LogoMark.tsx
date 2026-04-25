interface LogoMarkProps {
  size?: "default" | "lg";
}

export function LogoMark({ size = "default" }: LogoMarkProps) {
  return (
    <span className={`logo-mark${size === "lg" ? " lg" : ""}`}>
      <span className="glyph">R</span>
      <span className="word">Reckon</span>
    </span>
  );
}
