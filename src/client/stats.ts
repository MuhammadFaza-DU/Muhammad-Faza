import {registerPageEnhancement} from "./lifecycle";
import {getActiveYears} from "../lib/stats";

registerPageEnhancement("portfolio-stats",()=>{
  const counters=[...document.querySelectorAll<HTMLElement>("[data-stats-years]")];
  if(!counters.length)return ()=>{};
  let timer:ReturnType<typeof setTimeout>|undefined;
  const update=()=>{
    clearTimeout(timer);
    const now=new Date();
    for(const counter of counters) {
      const years=getActiveYears(Number(counter.dataset.startYear),now.getFullYear());
      counter.textContent=String(years);
      counter.setAttribute("value",String(years));
    }
    if(document.hidden)return;
    // Check at local midnight, avoiding the browser's maximum timeout limit.
    const midnight=new Date(now);
    midnight.setHours(24,0,0,0);
    timer=setTimeout(update,midnight.getTime()-now.getTime()+100);
  };
  document.addEventListener("visibilitychange",update);
  window.addEventListener("pageshow",update);
  update();
  return ()=>{
    clearTimeout(timer);
    document.removeEventListener("visibilitychange",update);
    window.removeEventListener("pageshow",update);
  };
});
