import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateKeyPairSync } from "crypto";

export async function GET(request: NextRequest, { params }: { params: Promise<{ method: string }> }) {
  // Await params to resolve the Promise and access properties
  const resolvedParams = await params;
  const method = resolvedParams.method;

  try {
    let publicKey = "";
    let privateKey = "";

    switch (method) {
      case "aes":
        // For AES, generate a random key and IV
        const key = crypto.randomBytes(32).toString("hex"); // 256 bits
        const iv = crypto.randomBytes(16).toString("hex");
        publicKey = JSON.stringify({ iv });
        privateKey = JSON.stringify({ key, iv });
        break;

      case "rsa":
        // Generate RSA key pair
        const rsaKeys = generateKeyPairSync("rsa", {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        });
        publicKey = rsaKeys.publicKey;
        privateKey = rsaKeys.privateKey;
        break;

      case "pgp":
        // Simulate PGP keys (in a real app, you'd use OpenPGP.js)
        publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: https://openpgpjs.org

xjMEYkXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
=XXXX
-----END PGP PUBLIC KEY BLOCK-----`;

        privateKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: https://openpgpjs.org

xVgEYkXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
=XXXX
-----END PGP PRIVATE KEY BLOCK-----`;
        break;

      case "tls":
        // Simulate TLS certificates
        const tlsKeys = generateKeyPairSync("rsa", {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        });

        // Create a self-signed certificate (simplified)
        publicKey = `-----BEGIN CERTIFICATE-----
MIIEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END CERTIFICATE-----`;
        privateKey = tlsKeys.privateKey;
        break;

      default:
        return NextResponse.json({ error: "Unsupported encryption method" }, { status: 400 });
    }

    return NextResponse.json({ publicKey, privateKey });
  } catch (error) {
    console.error("Error generating keys:", error);
    return NextResponse.json({ error: "Failed to generate keys" }, { status: 500 });
  }
}