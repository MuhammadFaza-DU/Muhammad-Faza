export const contactFields=["subject","email","message"] as const;
export type ContactField=typeof contactFields[number];
export type ContactValues=Record<ContactField,string>;

export function prepareContactValues(input:ContactValues) {
  const limits=contactFormConfig.limits;
  const values:ContactValues={
    subject:input.subject.replace(/[\r\n]+/g," ").trim(),
    email:input.email.trim(),
    message:input.message.trim(),
  };
  const errors:Partial<Record<ContactField,"required"|"tooLong">>={};
  for(const field of contactFields) {
    if(!values[field])errors[field]="required";
    else if(values[field].length>limits[field])errors[field]="tooLong";
  }
  return {values,errors};
}

type ContactResponse=
  | {kind:"success"}
  | {kind:"fields";fields:ContactField[]}
  | {kind:"rate-limit"}
  | {kind:"failure"};

export function classifyContactResponse(status:number,body:unknown):ContactResponse {
  if(status===429)return {kind:"rate-limit"};
  if(!body||typeof body!=="object")return {kind:"failure"};
  const payload=body as {ok?:unknown;errors?:unknown};
  const errors=Array.isArray(payload.errors)?payload.errors:[];
  if(status>=200&&status<300&&payload.ok===true&&
    (payload.errors===undefined||Array.isArray(payload.errors)&&errors.length===0))return {kind:"success"};
  if(status===400||status===422) {
    const fields=contactFields.filter(field=>errors.some(error=>
      error&&typeof error==="object"&&"field" in error&&error.field===field));
    if(fields.length)return {kind:"fields",fields};
  }
  return {kind:"failure"};
}
import {contactFormConfig} from "../data/contact-form.ts";
