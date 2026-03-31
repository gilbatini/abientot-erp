// PDF generation helpers using @react-pdf/renderer
// Import pdf() from @react-pdf/renderer in each action that needs to generate PDFs
// Pattern:
//   import { pdf } from "@react-pdf/renderer";
//   import { InvoicePDF } from "@/components/documents/InvoicePDF";
//   const blob   = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
//   const buffer = Buffer.from(await blob.arrayBuffer());
//   const base64 = buffer.toString("base64");
//   return base64; // send to client for download, or attach to email

export function base64ToDownload(base64: string, filename: string) {
  const bytes  = atob(base64);
  const arr    = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob   = new Blob([arr], { type: "application/pdf" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = filename;
  a.click();
  URL.revokeObjectURL(url);
}
