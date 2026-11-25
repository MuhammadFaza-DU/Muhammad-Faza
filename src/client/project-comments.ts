import {registerPageEnhancement} from "./lifecycle";
import {mergeComments,type PublicComment} from "../lib/project-comments";
import {readComments,sendComment} from "../lib/project-comments-request";
import {formatCommentTime} from "../lib/comment-time";

interface Turnstile {
  render:(target:HTMLElement,options:Record<string,unknown>)=>string;
  remove:(id:string)=>void;reset:(id:string)=>void;
}
const turnstile=()=> (window as Window&{turnstile?:Turnstile}).turnstile;
let scriptTask:Promise<Turnstile>|undefined;
function loadTurnstile():Promise<Turnstile>{
  if(turnstile())return Promise.resolve(turnstile()!);
  if(scriptTask)return scriptTask;
  scriptTask=new Promise<Turnstile>((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;
    const timer=setTimeout(()=>{script.remove();reject(new Error("challenge timeout"));},12000);
    script.onload=()=>{
      clearTimeout(timer);
      if(turnstile())resolve(turnstile()!);
      else{script.remove();reject(new Error("challenge unavailable"));}
    };
    script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error("challenge unavailable"));};
    document.head.append(script);
  }).catch(error=>{scriptTask=undefined;throw error;});
  return scriptTask;
}

registerPageEnhancement("project-comments",context=>{
  if(context.page!=="detail")return ()=>{};
  const panel=document.querySelector<HTMLElement>("[data-project-comments]");
  if(!panel)return ()=>{};
  const form=panel.querySelector<HTMLFormElement>("form")!;
  const name=form.querySelector<HTMLInputElement>("input")!,message=form.querySelector<HTMLTextAreaElement>("textarea")!;
  const submit=form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const list=panel.querySelector<HTMLOListElement>("[data-comments-list]")!;
  const empty=panel.querySelector<HTMLElement>("[data-comments-empty]")!;
  const status=panel.querySelector<HTMLElement>("[data-comments-status]")!;
  const feed=panel.querySelector<HTMLElement>("[data-comments-feed-status]")!;
  const more=panel.querySelector<HTMLButtonElement>("[data-comments-more]")!;
  const challenge=panel.querySelector<HTMLElement>("[data-comments-challenge]")!;
  const labels:Record<string,string>=JSON.parse(panel.dataset.copy!);
  const base=panel.dataset.commentsApi!,key=panel.dataset.commentsSitekey!,slug=panel.dataset.project!;
  const controller=new AbortController(),{signal}=controller;
  let comments:PublicComment[]=[],submitted:PublicComment[]=[],cursor:string|null=null,readStarted=false,reading=false,readFailed=false,loaded=false;
  let submitting=false,token="",widget:string|undefined,challengeLoading=false,draftKey="",requestId="";
  const alive=()=>!signal.aborted&&panel.isConnected;
  const hasGap=()=>submitted.some(item=>!comments.some(comment=>comment.id===item.id))&&(!loaded||cursor!==null||readFailed);
  const render=()=>{
    const top=list.scrollTop,viewport=list.getBoundingClientRect();
    const entries=[...list.querySelectorAll<HTMLElement>("[data-comment-entry]")];
    const atBottom=top+list.clientHeight>=list.scrollHeight-2;
    const anchor=atBottom?entries.at(-1):entries.find(el=>el.getBoundingClientRect().bottom>viewport.top+1);
    const anchorId=anchor?.dataset.commentEntry,anchorTop=anchor?anchor.getBoundingClientRect().top-viewport.top:undefined;
    const fragment=document.createDocumentFragment(),all=mergeComments(comments,submitted,"asc");
    for(const comment of all){
      if(hasGap()&&!comments.some(item=>item.id===comment.id)){
        const gap=document.createElement("li");gap.className="sr-only";gap.dataset.commentsGap="";
        gap.textContent=labels.gap;fragment.append(gap);
      }
      const entry=document.createElement("li"),author=document.createElement("strong"),body=document.createElement("p");
      const meta=document.createElement("div"),time=document.createElement("time");
      entry.className="project-comment";entry.dataset.commentEntry=comment.id;
      author.textContent=comment.displayName;body.textContent=comment.body;body.dataset.commentMessage="";
      meta.className="project-comment-meta";time.dateTime=comment.createdAt;
      time.textContent=formatCommentTime(comment.createdAt,context.locale);
      meta.append(time);entry.append(author,body,meta);fragment.append(entry);
    }
    list.replaceChildren(fragment);list.hidden=!all.length;list.scrollTop=top;
    if(anchorId&&anchorTop!==undefined){
      const restored=list.querySelector<HTMLElement>(`[data-comment-entry="${anchorId}"]`);
      if(restored)list.scrollTop+=restored.getBoundingClientRect().top-list.getBoundingClientRect().top-anchorTop;
    }
    empty.hidden=!loaded||Boolean(all.length);more.hidden=!(readFailed||cursor);more.disabled=reading;
    more.textContent=readFailed?labels.retry:labels.more;
  };
  const read=async()=>{
    if(reading||signal.aborted)return;
    reading=true;readStarted=true;feed.textContent=labels.loading;render();
    const page=base?await readComments(base,slug,loaded?cursor:null,{signal,order:"asc"}):null;
    if(!alive())return;
    reading=false;readFailed=!page;
    if(page){comments=mergeComments(comments,page.comments,"asc");cursor=page.nextCursor;loaded=true;feed.textContent="";}
    else feed.textContent="";
    render();
  };
  const initChallenge=async()=>{
    if(!base||!key||widget!==undefined||challengeLoading||signal.aborted)return;
    challengeLoading=true;
    try{
      const api=await loadTurnstile();if(!alive())return;
      widget=api.render(challenge,{
        sitekey:key,action:"project_comment",cData:slug,
        theme:document.documentElement.dataset.theme==="dark"?"dark":"light",
        size:form.clientWidth<300?"compact":"flexible",appearance:"interaction-only",
        callback:(value:string)=>{if(alive()){token=value;if(status.textContent===labels.challenge)status.textContent="";}},
        "expired-callback":()=>{token="";},
        "error-callback":()=>{token="";if(alive())status.textContent=labels.challengeError;},
      });
    }catch{if(alive())status.textContent=labels.challengeError;}
    finally{challengeLoading=false;}
  };
  form.addEventListener("focusin",()=>{void initChallenge();},{signal});
  for(const field of [name,message])field.addEventListener("input",()=>field.setCustomValidity(""),{signal});
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(submitting||signal.aborted)return;
    const displayName=name.value.trim(),body=message.value.replace(/\r\n?/g,"\n").trim();
    name.setCustomValidity(!displayName||displayName.length>60?labels.nameError:"");
    message.setCustomValidity(!body||body.length>1600?labels.messageError:"");
    if(!form.reportValidity())return;
    if(!token){status.textContent=labels.challenge;void initChallenge();return;}
    const fingerprint=JSON.stringify([displayName,body]);
    if(draftKey!==fingerprint){draftKey=fingerprint;requestId=globalThis.crypto.randomUUID();}
    submitting=true;submit.disabled=true;form.setAttribute("aria-busy","true");status.textContent=labels.sending;
    const result=await sendComment(base,slug,{displayName,body,requestId,token},{signal});
    if(!alive())return;
    if(result.kind==="success"){
      submitted=mergeComments(submitted,[result.comment],"asc");
      // A reader may edit the draft while the earlier request is in flight.
      if(JSON.stringify([name.value.trim(),message.value.replace(/\r\n?/g,"\n").trim()])===fingerprint)message.value="";
      status.textContent=labels.success;render();
      const row=list.querySelector<HTMLElement>(`[data-comment-entry="${result.comment.id}"]`);
      if(row)list.scrollTop+=row.getBoundingClientRect().top-list.getBoundingClientRect().top;
    }else if(result.kind==="unconfirmed")status.textContent=labels.unconfirmed;
    else status.textContent=result.code==="rate_limited"?labels.rate:result.code==="submission_deleted"?labels.deleted:
      result.code==="challenge_failed"?labels.challenge:labels.failure;
    submitting=false;submit.disabled=false;form.removeAttribute("aria-busy");
    token="";if(widget!==undefined)turnstile()?.reset(widget);
  },{signal});
  more.addEventListener("click",()=>{void read();},{signal});
  list.addEventListener("scroll",()=>{
    if(cursor&&!hasGap()&&!readFailed&&list.scrollTop+list.clientHeight>=list.scrollHeight-64)void read();
  },{signal,passive:true});
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)&&!readStarted)void read();
  },{rootMargin:"200px"});
  observer.observe(panel);
  const themeObserver=new MutationObserver(()=>{
    if(widget===undefined)return;
    turnstile()?.remove(widget);widget=undefined;token="";void initChallenge();
  });
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  submit.disabled=!base||!key;
  if(!base||!key){readFailed=true;render();}
  return ()=>{
    controller.abort();observer.disconnect();themeObserver.disconnect();
    if(widget!==undefined)turnstile()?.remove(widget);
    submit.disabled=true;
  };
});
