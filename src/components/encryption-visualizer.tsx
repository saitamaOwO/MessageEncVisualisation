"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface EncryptionVisualizerProps {
  method: string
  originalText: string
  encryptedText: string
  isEncrypting: boolean
}

export default function EncryptionVisualizer({
  method,
  originalText,
  encryptedText,
  isEncrypting,
}: EncryptionVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // If we don't have both texts, don't animate
    if (!originalText || !encryptedText) {
      drawPlaceholder(ctx, canvas)
      return
    }

    // Start animation
    setAnimating(true)
    let frame = 0
    const maxFrames = 120

    const animate = () => {
      if (frame >= maxFrames) {
        setAnimating(false)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const progress = frame / maxFrames

      if (isEncrypting) {
        drawEncryptionAnimation(ctx, canvas, originalText, encryptedText, progress, method)
      } else {
        drawDecryptionAnimation(ctx, canvas, encryptedText, originalText, progress, method)
      }

      frame++
      requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = canvasRef.current.offsetHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [originalText, encryptedText, isEncrypting, method])

  const drawPlaceholder = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = "#64748b"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Encrypt a message to see visualization", canvas.width / 2, canvas.height / 2)
  }

  const drawEncryptionAnimation = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    original: string,
    encrypted: string,
    progress: number,
    method: string,
  ) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw method-specific visualization
    switch (method) {
      case "aes":
        drawAesVisualization(ctx, canvas, progress)
        break
      case "rsa":
        drawRsaVisualization(ctx, canvas, progress)
        break
      case "pgp":
        drawPgpVisualization(ctx, canvas, progress)
        break
      case "tls":
        drawTlsVisualization(ctx, canvas, progress)
        break
      default:
        drawDefaultVisualization(ctx, canvas, progress)
    }

    // Draw text particles
    const particleCount = 50
    const radius = Math.min(canvas.width, canvas.height) * 0.4

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius * progress
      const y = centerY + Math.sin(angle) * radius * progress

      ctx.fillStyle = progress < 0.5 ? "#3b82f6" : "#10b981"
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawDecryptionAnimation = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    encrypted: string,
    original: string,
    progress: number,
    method: string,
  ) => {
    // Similar to encryption but reverse
    drawEncryptionAnimation(ctx, canvas, original, encrypted, 1 - progress, method)
  }

  const drawAesVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const gridSize = 8
    const blockSize = Math.min(canvas.width, canvas.height) / (gridSize * 1.5)
    const startX = (canvas.width - blockSize * gridSize) / 2
    const startY = (canvas.height - blockSize * gridSize) / 2

    // Draw AES block cipher visualization
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = startX + i * blockSize
        const y = startY + j * blockSize

        // Determine if this block should be "encrypted" based on progress
        const shouldBeEncrypted = Math.random() < progress

        ctx.fillStyle = shouldBeEncrypted ? "#10b981" : "#3b82f6"
        ctx.fillRect(x, y, blockSize * 0.9, blockSize * 0.9)
      }
    }
  }

  const drawRsaVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3

    // Draw prime number visualization (RSA is based on prime factorization)
    ctx.strokeStyle = "#f59e0b"
    ctx.lineWidth = 2

    // Draw two interlocking circles representing the two prime numbers
    ctx.beginPath()
    ctx.arc(centerX - radius * 0.3, centerY, radius * progress, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(centerX + radius * 0.3, centerY, radius * progress, 0, Math.PI * 2)
    ctx.stroke()

    // Draw lock in the center
    if (progress > 0.7) {
      const lockProgress = (progress - 0.7) / 0.3
      ctx.fillStyle = "#f59e0b"
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.2 * lockProgress, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawPgpVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = Math.min(canvas.width, canvas.height) * 0.4

    // Draw envelope-like visualization for PGP
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 2

    // Draw envelope
    ctx.beginPath()
    ctx.rect(centerX - size, centerY - size / 2, size * 2, size)
    ctx.stroke()

    // Draw seal/signature
    const sealRadius = size * 0.2
    ctx.beginPath()
    ctx.arc(centerX, centerY, sealRadius * progress, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(139, 92, 246, ${progress})`
    ctx.fill()

    // Draw key
    if (progress > 0.5) {
      const keyProgress = (progress - 0.5) / 0.5

      ctx.beginPath()
      ctx.moveTo(centerX - size * 0.5, centerY + size * 0.3)
      ctx.lineTo(centerX - size * 0.5 + size * keyProgress, centerY + size * 0.3)
      ctx.stroke()

      // Key teeth
      if (keyProgress > 0.7) {
        for (let i = 0; i < 3; i++) {
          const x = centerX - size * 0.5 + size * 0.8 + i * 10
          ctx.beginPath()
          ctx.moveTo(x, centerY + size * 0.3)
          ctx.lineTo(x, centerY + size * 0.3 - 10)
          ctx.stroke()
        }
      }
    }
  }

  const drawTlsVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3

    // Draw handshake visualization for TLS
    ctx.strokeStyle = "#ec4899"
    ctx.lineWidth = 2

    // Client
    ctx.fillStyle = "#ec4899"
    ctx.beginPath()
    ctx.arc(centerX - radius, centerY, 10, 0, Math.PI * 2)
    ctx.fill()

    // Server
    ctx.fillStyle = "#8b5cf6"
    ctx.beginPath()
    ctx.arc(centerX + radius, centerY, 10, 0, Math.PI * 2)
    ctx.fill()

    // Handshake messages
    if (progress > 0.2) {
      // Client Hello
      ctx.beginPath()
      ctx.moveTo(centerX - radius + 15, centerY - 5)
      ctx.lineTo(centerX - radius + 15 + (2 * radius - 30) * Math.min(1, (progress - 0.2) / 0.2), centerY - 5)
      ctx.stroke()
    }

    if (progress > 0.4) {
      // Server Hello
      ctx.beginPath()
      ctx.moveTo(centerX + radius - 15, centerY + 5)
      ctx.lineTo(centerX + radius - 15 - (2 * radius - 30) * Math.min(1, (progress - 0.4) / 0.2), centerY + 5)
      ctx.stroke()
    }

    if (progress > 0.6) {
      // Key Exchange
      ctx.beginPath()
      ctx.moveTo(centerX - radius + 15, centerY + 15)
      ctx.lineTo(centerX - radius + 15 + (2 * radius - 30) * Math.min(1, (progress - 0.6) / 0.2), centerY + 15)
      ctx.stroke()
    }

    if (progress > 0.8) {
      // Finished
      ctx.beginPath()
      ctx.moveTo(centerX + radius - 15, centerY + 25)
      ctx.lineTo(centerX + radius - 15 - (2 * radius - 30) * Math.min(1, (progress - 0.8) / 0.2), centerY + 25)
      ctx.stroke()

      // Secure connection established
      if (progress > 0.95) {
        ctx.fillStyle = "#10b981"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 15, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawDefaultVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * progress, 0, Math.PI * 2)
    ctx.stroke()
  }

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full" />
      {animating && (
        <motion.div
          className="absolute bottom-4 right-4 bg-slate-700 text-white px-3 py-1 rounded-full text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {isEncrypting ? "Encrypting..." : "Decrypting..."}
        </motion.div>
      )}
    </>
  )
}
