import { WhatsAppIcon } from "./icons/SocialIcons";
import { contact } from "../utils/siteInfo";

/** Floating WhatsApp button shown on every public page — lets visitors reach
 * the café directly instead of hunting for the number in the footer. */
export function WhatsAppButton() {
  return (
    <a
      href={contact.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
