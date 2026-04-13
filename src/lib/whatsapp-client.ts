const WA_API = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}`
const HEADERS = {
  Authorization:  `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
}

export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  await fetch(`${WA_API}/messages`, {
    method:  'POST',
    headers: HEADERS,
    body:    JSON.stringify({
      messaging_product: 'whatsapp',
      to:                to.replace('+', ''),
      type:              'text',
      text:              { body: text },
    }),
  })
}

export async function sendWhatsAppDocument(
  to:       string,
  pdfUrl:   string,
  filename: string,
): Promise<void> {
  await fetch(`${WA_API}/messages`, {
    method:  'POST',
    headers: HEADERS,
    body:    JSON.stringify({
      messaging_product: 'whatsapp',
      to:                to.replace('+', ''),
      type:              'document',
      document:          {
        link:     pdfUrl,
        filename: filename,
        caption:  `${filename} — À Bientôt Tour & Travels`,
      },
    }),
  })
}
