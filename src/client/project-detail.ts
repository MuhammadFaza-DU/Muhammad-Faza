import {registerPageEnhancement} from "./lifecycle";

registerPageEnhancement("project-detail-media",context=>{
  if(context.page!=="detail")return ()=>{};
  const image=document.querySelector<HTMLImageElement>("[data-detail-image]");
  const message=document.querySelector<HTMLElement>("[data-detail-media-error]");
  if(!image||!message)return ()=>{};
  const controller=new AbortController();
  const sync=()=>{
    const failed=image.complete&&image.naturalWidth===0;
    image.hidden=failed;
    message.hidden=!failed;
  };
  image.addEventListener("load",sync,{signal:controller.signal});
  image.addEventListener("error",sync,{signal:controller.signal});
  sync();
  return ()=>controller.abort();
});
