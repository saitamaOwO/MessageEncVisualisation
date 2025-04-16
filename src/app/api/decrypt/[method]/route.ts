import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest, { params }: { params: Promise<{ method: string }> }) {
  const { method } = await params // Resolve the Promise to access the method property

  try {
    const { encryptedMessage, privateKey, mitm = false } = await request.json()

    if (!encryptedMessage) {
      return NextResponse.json({ error: "Encrypted message is required" }, { status: 400 })
    }

    // If MITM attack is simulated, return a tampered message
    if (mitm) {
      return NextResponse.json({
        decryptedMessage:
          "⚠️ Message integrity compromised! This message has been tampered with by a Man-in-the-Middle attack.",
      })
    }

    let decryptedMessage = ""

    switch (method) {
      case "aes":
        // Parse the encrypted message to get the key and IV
        const aesData = JSON.parse(encryptedMessage)
        const key = Buffer.from(aesData.key, "hex")
        const iv = Buffer.from(aesData.iv, "hex")

        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
        decryptedMessage = decipher.update(aesData.encrypted, "base64", "utf8")
        decryptedMessage += decipher.final("utf8")
        break

      case "rsa":
        // Decrypt with RSA private key
        decryptedMessage = crypto
          .privateDecrypt(
            {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(encryptedMessage, "base64"),
          )
          .toString("utf8")
        break

      case "pgp":
        // Simulate PGP decryption
        // Extract the base64 content from the PGP message
        const pgpLines = encryptedMessage.split("\n")
        let base64Content = ""

        let inContent = false
        for (const line of pgpLines) {
          if (line === "-----BEGIN PGP MESSAGE-----") {
            inContent = true
            continue
          } else if (line === "-----END PGP MESSAGE-----") {
            break
          }

          if (inContent && !line.startsWith("Version:") && !line.startsWith("Comment:") && line.trim() !== "") {
            base64Content += line
          }
        }

        // Decode the base64 content
        decryptedMessage = Buffer.from(base64Content, "base64").toString("utf8")
        break

      case "tls":
        // Simulate TLS decryption
        const tlsData = JSON.parse(encryptedMessage)
        const tlsKey = Buffer.from(tlsData.key, "base64")
        const tlsIv = Buffer.from(tlsData.iv, "base64")
        const authTag = Buffer.from(tlsData.authTag, "base64")

        const tlsDecipher = crypto.createDecipheriv("aes-256-gcm", tlsKey, tlsIv)
        tlsDecipher.setAuthTag(authTag)

        decryptedMessage = tlsDecipher.update(tlsData.encrypted, "base64", "utf8")
        decryptedMessage += tlsDecipher.final("utf8")
        break

      default:
        return NextResponse.json({ error: "Unsupported encryption method" }, { status: 400 })
    }

    return NextResponse.json({ decryptedMessage })
  } catch (error) {
    console.error("Decryption error:", error)
    return NextResponse.json({ error: "Failed to decrypt message" }, { status: 500 })
  }
}