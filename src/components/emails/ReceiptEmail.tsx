import {
  Html, Head, Body, Container, Heading, Text, Hr
} from "@react-email/components";
import { BRAND, ALGORIOFFICE } from "@/types/app";

interface ReceiptEmailProps {
  receiptNumber: string;
  travellerName: string;
  amountPaid:    string;
  paymentDate:   string;
}

export function ReceiptEmail({ receiptNumber, travellerName, amountPaid, paymentDate }: ReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f1f3f4", fontFamily: "DM Sans, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#fff", borderRadius: 16, padding: 40 }}>
          <Heading style={{ color: "#2BBFB3", fontFamily: "Space Grotesk, sans-serif", margin: "0 0 4px", fontSize: 20 }}>
            {BRAND.name}
          </Heading>
          <Text style={{ color: "#5f6368", fontSize: 12, margin: "0 0 24px" }}>{BRAND.tagline}</Text>
          <Hr style={{ borderColor: "#2BBFB3", borderWidth: 2, margin: "0 0 24px" }} />
          <Text style={{ color: "#202124", fontSize: 15, margin: "0 0 8px" }}>
            Dear {travellerName},
          </Text>
          <Text style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.6 }}>
            Thank you — we have received your payment of <strong>{amountPaid}</strong> on{" "}
            <strong>{paymentDate}</strong>. Receipt <strong>{receiptNumber}</strong> is attached
            for your records.
          </Text>
          <Text style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.6, marginTop: 16 }}>
            For any queries please contact us at {BRAND.email} or call{" "}
            {BRAND.phones.join(" / ")}.
          </Text>
          <Hr style={{ borderColor: "#e8eaed", margin: "24px 0 16px" }} />
          <Text style={{ color: "#9aa0a6", fontSize: 11, margin: 0 }}>
            Sent via {ALGORIOFFICE.product} · {ALGORIOFFICE.website}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
