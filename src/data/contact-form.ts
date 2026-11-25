export const contactFormConfig={
  endpoint:"https://formspree.io/f/mdegeewb",
  acknowledgementTimeout:20_000,
  limits:{subject:160,email:254,message:5000},
};

const idLead=["Ada ide atau peluang kerja?","Ceritakan kebutuhan Anda di sini."] as const;
const enLead=["Have a project or a job opportunity?","Tell me what you need here."] as const;

export const contactFormCopy={
  id:{
    title:"Kirim pesan",
    lead:idLead.join(" "),leadSentences:idLead,
    subject:"Subjek",email:"Email",message:"Pesan",
    subjectPlaceholder:"Apa yang ingin Anda diskusikan?",
    emailPlaceholder:"Email untuk menerima balasan",
    messagePlaceholder:"Jelaskan kebutuhan atau pertanyaan Anda.",
    send:"Kirim pesan",sending:"Mengirim…",
    success:"Layanan pengiriman telah menerima pesan Anda. Terima kasih telah menghubungi saya.",
    invalid:"Periksa kolom yang ditandai sebelum mengirim.",
    required:"Kolom ini perlu diisi.",
    tooLong:"Isian terlalu panjang. Persingkat sebelum mengirim.",
    invalidEmail:"Masukkan alamat email yang valid.",
    rejected:"Layanan menolak isian ini. Periksa dan perbaiki sebelum mencoba lagi.",
    failure:"Pesan belum berhasil dikirim. Isian Anda tetap tersimpan di formulir. Coba lagi nanti atau gunakan kanal kontak lainnya.",
    rateLimit:"Layanan sedang membatasi pengiriman. Isian Anda tetap tersimpan di formulir. Coba lagi nanti atau gunakan kanal kontak lainnya.",
    unconfirmed:"Pengiriman belum dapat dikonfirmasi. Isian Anda tetap tersimpan di formulir. Periksa sebelum mengirim ulang agar tidak mengirim pesan ganda.",
    noJs:"Tanpa JavaScript, tombol kirim akan membuka halaman konfirmasi Formspree.",
  },
  en:{
    title:"Send a message",
    lead:enLead.join(" "),leadSentences:enLead,
    subject:"Subject",email:"Email",message:"Message",
    subjectPlaceholder:"What would you like to discuss?",
    emailPlaceholder:"Email address for my reply",
    messagePlaceholder:"Tell me what you need or would like to ask.",
    send:"Send message",sending:"Sending…",
    success:"Your message has been accepted by the delivery service. Thank you for getting in touch.",
    invalid:"Check the marked fields before sending.",
    required:"Please fill in this field.",
    tooLong:"This entry is too long. Shorten it before sending.",
    invalidEmail:"Enter a valid email address.",
    rejected:"The service rejected this field. Check and correct it before trying again.",
    failure:"The message could not be sent. Your entries are still here; try later or use one of the other contact channels.",
    rateLimit:"The service is limiting submissions. Your entries are still here; try later or use another contact channel.",
    unconfirmed:"Delivery could not be confirmed. Your entries are still here; check before sending again to avoid a duplicate message.",
    noJs:"Without JavaScript, sending will open Formspree's confirmation page.",
  },
};
