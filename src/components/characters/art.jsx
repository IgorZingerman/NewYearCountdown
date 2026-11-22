/**
 * Shared look for all characters, so they feel like one family: the same dark
 * blue outline, the same soft blue-white fur shading, and the same festive
 * colours.
 */

export const OUTLINE = '#2a3a60';
export const FUR = '#f7faff';
export const FUR_SHADE = '#cfe0f4';
export const RED = '#d9433f';
export const GOLD = '#f7c948';
export const INK = '#1b2238';
export const PINK = '#ff9fb0';

// Props for every outlined shape.
export const line = {
  stroke: OUTLINE,
  strokeWidth: 2.2,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
};

/** Soft ellipse on the snow under a character. */
export function Shadow({ cx, cy, rx, ry }) {
  return <ellipse data-part="shadow" cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(30,50,90,0.28)" />;
}

/** Party hat for the midnight celebration, centred on its base at (x, y). */
export function PartyHat({ x = 0, y = 0, rot = 0, size = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${size})`}>
      <polygon points="0,-20 -9,0 9,0" fill={GOLD} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-4.5,-10 4.5,-10 6.75,-5 -6.75,-5" fill={RED} />
      <circle cx="0" cy="-20" r="3" fill="#ffffff" stroke={OUTLINE} strokeWidth="1.2" />
    </g>
  );
}
