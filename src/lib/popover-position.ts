export interface Rect {left:number;top:number;width:number;height:number}
export function placePopover(anchor:Rect,size:{width:number;height:number},viewport:Rect,gap=12) {
  const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(Math.max(min,max),value));
  const below=anchor.top+anchor.height+gap;
  const top=below+size.height<=viewport.top+viewport.height-8?below:anchor.top-size.height-gap;
  return {
    left:clamp(anchor.left+anchor.width/2-size.width/2,viewport.left+8,viewport.left+viewport.width-size.width-8),
    top:clamp(top,viewport.top+8,viewport.top+viewport.height-size.height-8),
  };
}
