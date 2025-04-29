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

interface TransactionNotificationEmailProps {
  transactionId: string;
  type: "created" | "updated" | "completed";
  details: Record<string, any>;
}

export default function TransactionNotificationEmail({
  transactionId,
  type,
  details,
}: TransactionNotificationEmailProps) {
  const getSubject = () => {
    switch (type) {
      case "created":
        return "New Transaction Created";
      case "updated":
        return `Transaction Status Updated: ${details.status}`;
      case "completed":
        return "Transaction Completed";
      default:
        return "Transaction Notification";
    }
  };

  const getContent = () => {
    switch (type) {
      case "created":
        return (
          <>
            <Text style={text}>
              A new transaction has been created with ID: {transactionId}.
            </Text>
            <Text style={text}>Transaction Details:</Text>
            <Text style={list}>
              • Amount: ₦{details.amount.toFixed(2)}
              <br />• Product: {details.productDetails}
              <br />• Fee: ₦{details.fee.toFixed(2)} (2.5% of transaction
              amount)
            </Text>
          </>
        );
      case "updated":
        return (
          <>
            <Text style={text}>
              Your transaction with ID: {transactionId} has been updated.
            </Text>
            <Text style={text}>
              New Status: <strong>{details.status}</strong>
            </Text>
            {details.message && <Text style={text}>{details.message}</Text>}
          </>
        );
      case "completed":
        return (
          <>
            <Text style={text}>
              Your transaction with ID: {transactionId} has been completed
              successfully.
            </Text>
            <Text style={text}>Transaction Summary:</Text>
            <Text style={list}>
              • Amount: ₦{details.amount.toFixed(2)}
              <br />• Fee: ₦{details.fee.toFixed(2)}
              <br />• Net Amount: ₦{(details.amount - details.fee).toFixed(2)}
              <br />• Date Completed: {new Date().toLocaleDateString()}
            </Text>
          </>
        );
      default:
        return (
          <Text style={text}>
            There has been an update to your transaction with ID:{" "}
            {transactionId}.
          </Text>
        );
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getSubject()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{getSubject()}</Heading>
          {getContent()}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions/${transactionId}`}
            >
              View Transaction
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} CMIGL Escrow. All rights reserved.
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
