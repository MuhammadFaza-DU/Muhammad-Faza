export interface ContactChannel {
  id: "email" | "instagram" | "github" | "linkedin" | "youtube" | "tiktok";
  label: string;
  handle: string;
  url: string;
  icon: string;
}

export const contactChannels: ContactChannel[] = [
  {id:"email",label:"Email",handle:"lexfaza@gmail.com",url:"mailto:lexfaza@gmail.com",icon:"/media/social/email.svg"},
  {id:"instagram",label:"Instagram",handle:"@mfaz.aa",url:"https://www.instagram.com/mfaz.aa/",icon:"/media/social/instagram.svg"},
  {id:"github",label:"GitHub",handle:"MuhammadFaza-DU",url:"https://github.com/MuhammadFaza-DU",icon:"/media/social/github.svg"},
  {id:"linkedin",label:"LinkedIn",handle:"m-faza",url:"https://www.linkedin.com/in/m-faza-443479372",icon:"/media/social/linkedin.svg"},
  {id:"youtube",label:"YouTube",handle:"@MuhammadFaza-justone",url:"https://www.youtube.com/@MuhammadFaza-justone",icon:"/media/social/youtube.svg"},
  {id:"tiktok",label:"TikTok",handle:"@mfaz.aa",url:"https://www.tiktok.com/@mfaz.aa",icon:"/media/social/tiktok.svg"},
];
