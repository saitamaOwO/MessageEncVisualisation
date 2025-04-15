"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, Unlock, Shield, Clock, FileText, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MonacoEditor from "@/components/monaco-editor"
import EncryptionVisualizer from "@/components/encryption-visualizer"
import ThreeDAnimation from "@/components/three-d-animation"

const encryptionMethods = [
  { id: "aes", name: "AES-256", description: "Advanced Encryption Standard" },
  { id: "rsa", name: "RSA-2048", description: "Rivest–Shamir–Adleman" },
  { id: "pgp", name: "PGP", description: "Pretty Good Privacy" },
  { id: "tls", name: "TLS", description: "Transport Layer Security Simulation" },
]

export default function EncryptionPlayground() {
  const [activeTab, setActiveTab] = useState("encrypt")
  const [selectedMethod, setSelectedMethod] = useState("aes")
  const [message, setMessage] = useState("Your secret message here...")
  const [encryptedMessage, setEncryptedMessage] = useState("")
  const [decryptedMessage, setDecryptedMessage] = useState("")
  const [keys, setKeys] = useState({ publicKey: "", privateKey: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showMitm, setShowMitm] = useState(false)
  const [metrics, setMetrics] = useState({
    encryptionTime: 0,
    decryptionTime: 0,
    originalSize: 0,
    encryptedSize: 0,
    strength: 0,
  })
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  // Generate keys when encryption method changes
  useEffect(() => {
    generateKeys()
  }, [selectedMethod])

  const generateKeys = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/keys/${selectedMethod}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate keys")
      }

      const data = await response.json()
      setKeys({
        publicKey: data.publicKey,
        privateKey: data.privateKey,
      })
    } catch (err) {
      setError("Error generating keys: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const encryptMessage = async () => {
    if (!message.trim()) {
      setError("Please enter a message to encrypt")
      return
    }

    setLoading(true)
    setError("")

    try {
      const startTime = performance.now()

      const response = await fetch(`/api/encrypt/${selectedMethod}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          publicKey: keys.publicKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Encryption failed")
      }

      const data = await response.json()
      const endTime = performance.now()

      setEncryptedMessage(data.encryptedMessage)
      setMetrics({
        ...metrics,
        encryptionTime: endTime - startTime,
        originalSize: new Blob([message]).size,
        encryptedSize: new Blob([data.encryptedMessage]).size,
        strength: getEncryptionStrength(selectedMethod),
      })

      setActiveTab("decrypt")
    } catch (err) {
      setError("Error encrypting message: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const decryptMessage = async () => {
    if (!encryptedMessage) {
      setError("No encrypted message to decrypt")
      return
    }

    setLoading(true)
    setError("")

    try {
      const startTime = performance.now()

      const response = await fetch(`/api/decrypt/${selectedMethod}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          encryptedMessage,
          privateKey: keys.privateKey,
          mitm: showMitm,
        }),
      })

      if (!response.ok) {
        throw new Error("Decryption failed")
      }

      const data = await response.json()
      const endTime = performance.now()

      setDecryptedMessage(data.decryptedMessage)
      setMetrics({
        ...metrics,
        decryptionTime: endTime - startTime,
      })
    } catch (err) {
      setError("Error decrypting message: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const getEncryptionStrength = (method: string) => {
    switch (method) {
      case "aes":
        return 85
      case "rsa":
        return 90
      case "pgp":
        return 95
      case "tls":
        return 88
      default:
        return 0
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Encryption Playground</h1>
        <p className="text-slate-300 text-center max-w-2xl">
          An educational tool to test and compare different encryption techniques through an interactive interface.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Encryption Testing</CardTitle>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {encryptionMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center">
                          <span>{method.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {method.description}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                Send encrypted messages from User A to User B using{" "}
                {encryptionMethods.find((m) => m.id === selectedMethod)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="encrypt">
                    <Lock className="mr-2 h-4 w-4" />
                    Encrypt (User A)
                  </TabsTrigger>
                  <TabsTrigger value="decrypt">
                    <Unlock className="mr-2 h-4 w-4" />
                    Decrypt (User B)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="encrypt" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message to Encrypt</Label>
                    <MonacoEditor value={message} onChange={setMessage} language="plaintext" height="200px" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Public Key (User B)</Label>
                      <Button variant="outline" size="sm" onClick={generateKeys}>
                        Regenerate Keys
                      </Button>
                    </div>
                    <MonacoEditor
                      value={keys.publicKey}
                      onChange={() => {}}
                      language="plaintext"
                      height="100px"
                      readOnly
                    />
                  </div>

                  <Button onClick={encryptMessage} disabled={loading || !message.trim()} className="w-full">
                    {loading ? "Encrypting..." : "Encrypt Message"}
                  </Button>
                </TabsContent>

                <TabsContent value="decrypt" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Encrypted Message</Label>
                    <MonacoEditor
                      value={encryptedMessage}
                      onChange={setEncryptedMessage}
                      language="plaintext"
                      height="200px"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Private Key (User B)</Label>
                      <Button variant="ghost" size="sm" onClick={() => setShowPrivateKey(!showPrivateKey)}>
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <MonacoEditor
                      value={
                        showPrivateKey
                          ? keys.privateKey
                          : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                      }
                      onChange={() => {}}
                      language="plaintext"
                      height="100px"
                      readOnly
                    />
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Switch id="mitm" checked={showMitm} onCheckedChange={setShowMitm} />
                    <Label htmlFor="mitm">Simulate Man-in-the-Middle Attack</Label>
                  </div>

                  <Button onClick={decryptMessage} disabled={loading || !encryptedMessage} className="w-full">
                    {loading ? "Decrypting..." : "Decrypt Message"}
                  </Button>

                  {decryptedMessage && (
                    <div className="mt-4 space-y-2">
                      <Label>Decrypted Result</Label>
                      <Card className="bg-slate-700 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap">{decryptedMessage}</pre>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Encryption Metrics</CardTitle>
              <CardDescription>Performance and security analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Encryption Time
                  </Label>
                  <span>{metrics.encryptionTime.toFixed(2)} ms</span>
                </div>
                <Progress value={Math.min(100, metrics.encryptionTime / 10)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Decryption Time
                  </Label>
                  <span>{metrics.decryptionTime.toFixed(2)} ms</span>
                </div>
                <Progress value={Math.min(100, metrics.decryptionTime / 10)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Size Comparison
                  </Label>
                  <span>
                    {metrics.originalSize} B → {metrics.encryptedSize} B
                  </span>
                </div>
                <Progress
                  value={metrics.encryptedSize > 0 ? (metrics.originalSize / metrics.encryptedSize) * 100 : 0}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Encryption Strength
                  </Label>
                  <span>{metrics.strength}/100</span>
                </div>
                <Progress value={metrics.strength} className="bg-slate-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Encryption Visualization</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] relative">
              <EncryptionVisualizer
                method={selectedMethod}
                originalText={message}
                encryptedText={encryptedMessage}
                isEncrypting={activeTab === "encrypt"}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>3D Encryption Process Visualization</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ThreeDAnimation
              method={selectedMethod}
              encryptionInProgress={loading}
              encryptionComplete={!!encryptedMessage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
