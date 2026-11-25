export function canRunDotGrid({
  visible,hidden,paused,contextLost,
}:{visible:boolean;hidden:boolean;paused:boolean;contextLost:boolean}):boolean {
  return visible&&!hidden&&!paused&&!contextLost;
}
