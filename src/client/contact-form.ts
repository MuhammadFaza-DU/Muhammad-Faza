import {registerPageEnhancement} from "./lifecycle";
import {contactFormConfig,contactFormCopy} from "../data/contact-form";
import {classifyContactResponse,contactFields,prepareContactValues,type ContactField} from "../lib/contact-form";

registerPageEnhancement("contact-form",context=>{
  const form=document.querySelector<HTMLFormElement>("[data-contact-form]");
  const button=form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status=form?.querySelector<HTMLElement>("[data-contact-status]");
  if(context.page!=="contact"||!form||!button||!status)return ()=>{};
  const fields=Object.fromEntries(contactFields.map(name=>[name,
    form.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[name="${name}"]`)!,
  ])) as Record<ContactField,HTMLInputElement|HTMLTextAreaElement>;
  const t=contactFormCopy[context.locale];
  const controller=new AbortController();
  let request:AbortController|null=null,timeout=0;
  form.noValidate=true;
  form.dataset.contactEnhanced="true";
  const fieldError=(name:ContactField,message:string)=>{
    const error=form.querySelector<HTMLElement>(`[data-contact-error="${name}"]`)!;
    fields[name].setAttribute("aria-invalid",String(!!message));
    fields[name].setCustomValidity(message);
    error.textContent=message;error.hidden=!message;
  };
  const pending=(value:boolean)=>{
    button.disabled=value;button.textContent=value?t.sending:t.send;
    form.setAttribute("aria-busy",String(value));
    for(const field of Object.values(fields))field.readOnly=value;
  };
  const submit=async()=>{
    if(request)return;
    for(const name of contactFields)fieldError(name,"");
    const prepared=prepareContactValues({subject:fields.subject.value,email:fields.email.value,message:fields.message.value});
    let invalid:ContactField|undefined;
    for(const name of contactFields) {
      const error=prepared.errors[name];
      const message=error?t[error]:fields[name].validity.typeMismatch?t.invalidEmail:"";
      if(message){fieldError(name,message);invalid??=name;}
    }
    if(invalid) {
      status.textContent=t.invalid;form.dataset.contactState="error";fields[invalid].focus();return;
    }
    const data=new FormData();
    for(const name of contactFields)data.set(name,prepared.values[name]);
    request=new AbortController();
    const activeRequest=request;
    timeout=window.setTimeout(()=>activeRequest.abort(),contactFormConfig.acknowledgementTimeout);
    pending(true);form.dataset.contactState="submitting";status.textContent=t.sending;
    try {
      const response=await fetch(contactFormConfig.endpoint,{
        method:"POST",body:data,headers:{Accept:"application/json"},signal:activeRequest.signal,
      });
      const body:unknown=await response.json().catch(error=>{
        if(error instanceof SyntaxError&&!activeRequest.signal.aborted)return null;
        throw error;
      });
      if(controller.signal.aborted)return;
      const result=classifyContactResponse(response.status,body);
      if(result.kind==="success") {
        form.reset();form.dataset.contactState="success";status.textContent=t.success;
      } else {
        form.dataset.contactState="error";
        status.textContent=result.kind==="rate-limit"?t.rateLimit:t.failure;
        if(result.kind==="fields") {
          for(const name of result.fields)fieldError(name,t.rejected);
          fields[result.fields[0]].focus();
        }
      }
    } catch {
      if(!controller.signal.aborted) {
        form.dataset.contactState="unconfirmed";status.textContent=t.unconfirmed;
      }
    } finally {
      window.clearTimeout(timeout);
      if(!controller.signal.aborted){pending(false);request=null;}
    }
  };
  form.addEventListener("submit",event=>{event.preventDefault();void submit();},{signal:controller.signal});
  form.addEventListener("input",event=>{
    if(request||!(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement))return;
    const name=event.target.name as ContactField;
    if(contactFields.includes(name))fieldError(name,"");
    status.textContent="";form.dataset.contactState="idle";
  },{signal:controller.signal});
  return ()=>{
    controller.abort();request?.abort();window.clearTimeout(timeout);
    form.noValidate=false;
  };
});
