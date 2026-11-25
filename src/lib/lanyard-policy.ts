export interface LanyardPolicyInput {
  reduced: boolean;
  visible: boolean;
  documentHidden: boolean;
  webglReady: boolean;
}

export function lanyardPolicy({reduced,visible,documentHidden,webglReady}: LanyardPolicyInput) {
  const simulate = !reduced && visible && !documentHidden && webglReady;
  return {autoIntro:simulate,simulate,showFallback:reduced || !webglReady};
}
