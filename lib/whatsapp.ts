const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, visite su pagina web y me gustaria recibir informacion sobre sus productos.";

export function getWhatsAppHref(
  phone: string | null | undefined,
  message = DEFAULT_WHATSAPP_MESSAGE
) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  const internationalPhone = digits.length === 10 ? `1${digits}` : digits;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}
