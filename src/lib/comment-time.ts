import type {Locale} from "../data/types";

const formats={
  id:new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"Asia/Jakarta"}),
  en:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"UTC"}),
};

export function formatCommentTime(iso:string,locale:Locale):string {
  const parts=Object.fromEntries(formats[locale].formatToParts(new Date(iso)).map(part=>[part.type,part.value]));
  return `${parts.day} ${parts.month} ${parts.year} · ${parts.hour}${locale==="id"?".":":"}${parts.minute} ${locale==="id"?"WIB":"UTC"}`;
}
