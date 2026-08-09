const NodemailerErrorCodes = {
  ECONNECTION: "Connection closed unexpectedly",
  ETIMEDOUT: "Connection or operation timed out",
  ESOCKET: "Socket-level error",
  EDNS: "DNS resolution failed",

  ETLS: "TLS handshake or STARTTLS failed",
  EREQUIRETLS: "REQUIRETLS not supported by server (RFC 8689)",

  EPROTOCOL: "Invalid SMTP server response",
  EENVELOPE: "Invalid mail envelope (sender or recipients)",
  EMESSAGE: "Message delivery error",
  ESTREAM: "Stream processing error",

  EAUTH: "Authentication failed",
  ENOAUTH: "Authentication credentials not provided",
  EOAUTH2: "OAuth2 token generation or refresh error",

  EMAXLIMIT: "Pool resource limit reached (max messages per connection)",

  ESENDMAIL: "Sendmail command error",
  ESES: "AWS SES transport error",

  ECONFIG: "Invalid configuration",
  EPROXY: "Proxy connection error",
  EFILEACCESS: "File access rejected (disableFileAccess is set)",
  EURLACCESS: "URL access rejected (disableUrlAccess is set)",
  EFETCH: "HTTP fetch error",
} as const;

type NodemailerError = {
  code: keyof typeof NodemailerErrorCodes;
} & Error;

export const isNodemailerError = (error: unknown): error is NodemailerError => {
  const err = error as NodemailerError;

  return err !== undefined && err.code !== undefined;
};
