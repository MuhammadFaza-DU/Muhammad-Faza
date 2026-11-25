export interface RevealState {
  phase:"armed"|"running"|"settled";
  lastScrollY:number;
  departed:boolean;
}
export interface RevealInput {fullyOutside:boolean;entered:boolean;scrollY:number;finished:boolean}

export function advanceReveal(state:RevealState,input:RevealInput):{state:RevealState;play:boolean} {
  let departed=state.departed||(input.fullyOutside&&Math.abs(input.scrollY-state.lastScrollY)>.5);
  let phase=state.phase;
  if(input.finished&&phase==="running"){
    if(input.entered)departed=false;
    phase=departed?"armed":"settled";
  }
  if(phase==="settled"&&departed)phase="armed";
  const play=phase==="armed"&&input.entered&&!input.finished;
  return {state:{phase:play?"running":phase,lastScrollY:input.scrollY,departed:play?false:departed},play};
}
