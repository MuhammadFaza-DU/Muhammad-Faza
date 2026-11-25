export interface OrbitLayout {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export function orbitLayout(width:number,height:number):OrbitLayout & {hitSize:number} {
  const hitSize=width<600?56:64;
  const radiusX=Math.max(0,width/2-hitSize/2-8);
  const radiusY=Math.max(96,Math.min(width*.13,height*.2));
  const verticalExtent=Math.hypot(radiusX*Math.sin(8*Math.PI/180),radiusY*Math.cos(8*Math.PI/180));
  return {centerX:width/2,centerY:height-verticalExtent-hitSize/2-8,radiusX,radiusY,hitSize};
}

export function projectOrbit(angle: number, layout: OrbitLayout): {
  x: number; y: number; depth: "front" | "back"; scale: number;
} {
  const inclination = -8 * Math.PI / 180;
  const x = Math.cos(angle) * layout.radiusX;
  const y = Math.sin(angle) * layout.radiusY;
  return {
    x: layout.centerX + x * Math.cos(inclination) - y * Math.sin(inclination),
    y: layout.centerY + x * Math.sin(inclination) + y * Math.cos(inclination),
    depth: Math.sin(angle) >= 0 ? "front" : "back",
    scale: .85 + .15 * (Math.sin(angle) + 1) / 2,
  };
}
