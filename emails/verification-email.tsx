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

interface VerificationEmailProps {
  verificationUrl: string;
}

export default function VerificationEmail({
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Vokun Escrow</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Email Verification</Heading>
          <Text style={text}>
            Thank you for registering with Vokun Escrow. Please verify your
            email address to continue with the registration process.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={text}>
            If you didn't request this email, there's nothing to worry about -
            you can safely ignore it.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} Vokun Escrow. All rights reserved.
            <br />
            <Link href="https://vokunescrow.com/terms" style={link}>
              Terms of Service
            </Link>{" "}
            •{" "}
            <Link href="https://vokunescrow.com/privacy" style={link}>
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
