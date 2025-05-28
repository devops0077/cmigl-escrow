import { _escrowConfig } from "@/config";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to CMIGL Escrow!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to CMIGL Escrow!</Heading>
          <Text style={text}>Hello {name},</Text>
          <Text style={text}>
            Thank you for completing your registration with CMIGL Escrow. Your
            account is now active and ready to use.
          </Text>
          <Text style={text}>With CMIGL Escrow, you can:</Text>
          <Text style={list}>
            • Safely buy and sell products and services
            <br />• Protect your transactions with our secure escrow system
            <br />• Manage your wallet and track your transaction history
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            >
              Go to Dashboard
            </Button>
          </Section>
          <Text style={text}>
            If you have any questions or need assistance, please don't hesitate
            to contact our support team.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} CMIGL Escrow. All rights reserved.
            <br />
            <Link href={`${_escrowConfig.publicUrl}/terms`} style={link}>
              Terms of Service
            </Link>{" "}
            •{" "}
            <Link href={`${_escrowConfig.publicUrl}/privacy`} style={link}>
              Privacy Policy
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  borderRadius: "5px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const list = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  paddingLeft: "20px",
};

const buttonContainer = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#02AC73",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
};

const link = {
  color: "#7c3aed",
  textDecoration: "underline",
};
