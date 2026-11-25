export type MotionGroup = "tool" | "technology";
export interface GroupPause { hover: boolean; focus: boolean; popup: boolean }
export interface ShowcaseState {
  groups: Record<MotionGroup,GroupPause>;
  offscreen: boolean;
  documentHidden: boolean;
  selection: {id:string;group:MotionGroup;source?:"loop"|"list"} | null;
}
export const initialShowcaseState: ShowcaseState = {
  groups:{tool:{hover:false,focus:false,popup:false},technology:{hover:false,focus:false,popup:false}},
  offscreen:false,documentHidden:false,selection:null,
};
export function setGroupPause(state:ShowcaseState,group:MotionGroup,reason:keyof GroupPause,value:boolean):ShowcaseState {
  return {...state,groups:{...state.groups,[group]:{...state.groups[group],[reason]:value}}};
}
export function selectSkill(state:ShowcaseState,selection:ShowcaseState["selection"]):ShowcaseState {
  let next=setGroupPause(setGroupPause(state,"tool","popup",false),"technology","popup",false);
  if(selection&&selection.source!=="list") next=setGroupPause(next,selection.group,"popup",true);
  return {...next,selection};
}
export function dismissSkill(state:ShowcaseState):ShowcaseState {
  return {...state,selection:null,
    groups:{tool:{hover:false,focus:false,popup:false},technology:{hover:false,focus:false,popup:false}}};
}
export function groupIsPaused(state:ShowcaseState,group:MotionGroup):boolean {
  return state.offscreen || state.documentHidden || Object.values(state.groups[group]).some(Boolean);
}

export function advanceMotionTime(elapsedMs: number, deltaMs: number, paused: boolean): number {
  return paused ? elapsedMs : elapsedMs + deltaMs;
}
