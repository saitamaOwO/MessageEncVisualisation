import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest, { params }: { params: Promise<{ method: string }> }) {
  const { method } = await params // Resolve the Promise to access the method property

  try {
    const { message, publicKey } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let encryptedMessage = ""

    switch (method) {
      case "aes":
        // Parse the public key (which contains the IV)
        const { iv } = JSON.parse(publicKey)

        // For demo purposes, we'll use a fixed key
        // In a real app, this would be securely exchanged
        const key = crypto.randomBytes(32)
        const ivBuffer = Buffer.from(iv, "hex")

        const cipher = crypto.createCipheriv("aes-256-cbc", key, ivBuffer)
        encryptedMessage = cipher.update(message, "utf8", "base64")
        encryptedMessage += cipher.final("base64")

        // Include the key in the response (in a real app, this would be encrypted with RSA)
        encryptedMessage = JSON.stringify({
          encrypted: encryptedMessage,
          key: key.toString("hex"),
          iv,
        })
        break

      case "rsa":
        // Encrypt with RSA public key
        encryptedMessage = crypto
          .publicEncrypt(
            {
              key: publicKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(message),
          )
          .toString("base64")
        break

      case "pgp":
        // Simulate PGP encryption (in a real app, you'd use OpenPGP.js)
        // This is just a placeholder for demonstration
        const pgpHeader =
          "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v4.10.10\nComment: https://openpgpjs.org\n\n"
        const pgpFooter = "\n-----END PGP MESSAGE-----"

        // Simple base64 encoding for demo purposes
        const base64Message = Buffer.from(message).toString("base64")

        // Split the base64 string into lines of 64 characters
        let formattedMessage = ""
        for (let i = 0; i < base64Message.length; i += 64) {
          formattedMessage += base64Message.substring(i, i + 64) + "\n"
        }

        encryptedMessage = pgpHeader + formattedMessage + pgpFooter
        break

      case "tls":
        // Simulate TLS encryption
        // In a real TLS implementation, this would involve handshakes and session keys
        const tlsKey = crypto.randomBytes(32)
        const tlsIv = crypto.randomBytes(16)

        const tlsCipher = crypto.createCipheriv("aes-256-gcm", tlsKey, tlsIv)
        let tlsEncrypted = tlsCipher.update(message, "utf8", "base64")
        tlsEncrypted += tlsCipher.final("base64")
        const authTag = tlsCipher.getAuthTag().toString("base64")

        encryptedMessage = JSON.stringify({
          encrypted: tlsEncrypted,
          iv: tlsIv.toString("base64"),
          authTag,
          // In a real TLS implementation, the key would be exchanged using the certificate
          key: tlsKey.toString("base64"),
        })
        break

      default:
        return NextResponse.json({ error: "Unsupported encryption method" }, { status: 400 })
    }

    return NextResponse.json({ encryptedMessage })
  } catch (error) {
    console.error("Encryption error:", error)
    return NextResponse.json({ error: "Failed to encrypt message" }, { status: 500 })
  }
}