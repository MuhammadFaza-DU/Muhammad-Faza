/** @param {number} deltaPx @param {number} elapsedMs */
export function scrollImpulse(deltaPx,elapsedMs) {
  if(!Number.isFinite(deltaPx)||!Number.isFinite(elapsedMs)||elapsedMs<=0||elapsedMs>500)
    return {linear:0,angular:0};
  const delta=Math.max(-120,Math.min(120,deltaPx));
  const strength=Math.max(-1,Math.min(1,delta/Math.max(16,elapsedMs)/4));
  return {linear:strength*1.8,angular:strength*2.4};
}

/** @param {number} initialY @param {number} initialTime */
export function createScrollInput(initialY,initialTime) {
  let y=initialY,time=initialTime,queuedAt=null;
  return {
    /** @param {number} now */
    queue(now){if(queuedAt===null)queuedAt=now;},
    /** @param {number} nextY @param {number} now */
    reset(nextY,now){y=nextY;time=now;queuedAt=null;},
    /** @param {number} nextY @param {number} now @param {number} maxDelta */
    consume(nextY,now,maxDelta){
      const delta=nextY-y;
      const elapsed=queuedAt===null?now-time:now-queuedAt;
      y=nextY;time=now;queuedAt=null;
      return Math.abs(delta)>maxDelta?{linear:0,angular:0}:scrollImpulse(delta,elapsed);
    },
  };
}
