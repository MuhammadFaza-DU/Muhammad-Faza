import { registerPageEnhancement } from "./lifecycle";

registerPageEnhancement("contact", () => {
const controller = new AbortController();
const button = document.querySelector<HTMLButtonElement>("[data-copy-email]");
const status = document.querySelector<HTMLElement>("[data-copy-status]");
if (button && status) {
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("lexfaza@gmail.com");
      status.textContent = button.dataset.copied!;
    } catch {
      status.textContent = button.dataset.failed!;
    }
  },{signal:controller.signal});
}
return () => controller.abort();
});
