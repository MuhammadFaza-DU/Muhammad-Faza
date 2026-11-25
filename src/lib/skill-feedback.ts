const feedback=new WeakMap<HTMLElement,Animation>();

export function skillFeedback(button:HTMLButtonElement,pointer:boolean):void {
  const face=button.querySelector<HTMLElement>("img")??button;
  feedback.get(face)?.cancel();
  if(!pointer)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease=getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim();
  const animation=face.animate(reduced?[{opacity:.65},{opacity:1}]:[
    {transform:"scale(1)"},{transform:"scale(.94)",offset:.25},
    {transform:"scale(1.06)",offset:.65},{transform:"scale(1)"},
  ],{duration:reduced?140:240,easing:ease});
  feedback.set(face,animation);
  void animation.finished.catch(()=>{}).then(()=>{if(feedback.get(face)===animation)feedback.delete(face);});
}
