"use client"

import { useEffect, useRef, useCallback } from "react"
import * as THREE from "three"

interface ThreeDAnimationProps {
  method: string
  encryptionInProgress: boolean
  encryptionComplete: boolean
}

export default function ThreeDAnimation({ method, encryptionInProgress, encryptionComplete }: ThreeDAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const lockRef = useRef<THREE.Mesh | THREE.Group | null>(null)
  const keyRef = useRef<THREE.Group | null>(null)

  // Define createMethodSpecificObjects as useCallback
  const createMethodSpecificObjects = useCallback((method: string) => {
    if (!sceneRef.current) return

    // Create particles
    const particleCount = 1000
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Create a sphere of particles
      const radius = 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta)
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      particlePositions[i + 2] = radius * Math.cos(phi)
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))

    // Different particle colors for different methods
    let particleColor: number
    switch (method) {
      case "aes":
        particleColor = 0x10b981 // Green
        break
      case "rsa":
        particleColor = 0xf59e0b // Amber
        break
      case "pgp":
        particleColor = 0x8b5cf6 // Purple
        break
      case "tls":
        particleColor = 0xec4899 // Pink
        break
      default:
        particleColor = 0x3b82f6 // Blue
    }

    const particleMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particlesRef.current = particles
    sceneRef.current.add(particles)

    // Create method-specific objects
    switch (method) {
      case "aes":
        createAesObjects()
        break
      case "rsa":
        createRsaObjects()
        break
      case "pgp":
        createPgpObjects()
        break
      case "tls":
        createTlsObjects()
        break
      default:
        createDefaultObjects()
    }
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x1e293b)

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    cameraRef.current = camera
    camera.position.z = 5

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    rendererRef.current = renderer
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create method-specific 3D objects
    createMethodSpecificObjects(method)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

      // Rotate objects
      if (lockRef.current) {
        lockRef.current.rotation.y += 0.01
      }

      if (keyRef.current) {
        keyRef.current.rotation.y += 0.015
      }

      // Animate particles
      if (particlesRef.current && particlesRef.current.geometry instanceof THREE.BufferGeometry) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          // Apply sine wave animation to particles
          positions[i + 1] += Math.sin((Date.now() + i) * 0.001) * 0.01

          // If encryption is in progress, move particles toward the center
          if (encryptionInProgress) {
            const x = positions[i]
            const y = positions[i + 1]
            const z = positions[i + 2]
            const distance = Math.sqrt(x * x + y * y + z * z)

            if (distance > 0.1) {
              positions[i] *= 0.99
              positions[i + 2] *= 0.99
            }
          } else if (encryptionComplete) {
            // When encryption is complete, expand particles outward
            const x = positions[i]
            const y = positions[i + 1]
            const z = positions[i + 2]
            const distance = Math.sqrt(x * x + y * y + z * z)

            if (distance < 3) {
              positions[i] *= 1.01
              positions[i + 2] *= 1.01
            }
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Save a reference to the container for cleanup
    const currentContainer = containerRef.current

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && currentContainer) {
        currentContainer.removeChild(rendererRef.current.domElement)
      }

      // Dispose of geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose()
            }

            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose())
              } else {
                object.material.dispose()
              }
            }
          }
        })
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [method, createMethodSpecificObjects, encryptionInProgress, encryptionComplete])

  // Update when method or encryption status changes
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove existing objects
    if (lockRef.current) {
      sceneRef.current.remove(lockRef.current)
      lockRef.current = null
    }

    if (keyRef.current) {
      sceneRef.current.remove(keyRef.current)
      keyRef.current = null
    }

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current)
      particlesRef.current = null
    }

    // Create new objects for the selected method
    createMethodSpecificObjects(method)
  }, [method, createMethodSpecificObjects])

  const createAesObjects = () => {
    if (!sceneRef.current) return

    // Create a grid of cubes representing AES blocks
    const gridGroup = new THREE.Group()
    const gridSize = 4
    const blockSize = 0.2
    const spacing = 0.25

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize)
          const material = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.7,
          })

          const cube = new THREE.Mesh(geometry, material)
          cube.position.set(
            (x - gridSize / 2 + 0.5) * spacing,
            (y - gridSize / 2 + 0.5) * spacing,
            (z - gridSize / 2 + 0.5) * spacing,
          )

          gridGroup.add(cube)
        }
      }
    }

    lockRef.current = gridGroup
    sceneRef.current.add(gridGroup)
  }

  const createRsaObjects = () => {
    if (!sceneRef.current) return

    // Create a key and lock for RSA
    const keyGroup = new THREE.Group()

    // Key handle
    const handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32)
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    keyGroup.add(handle)

    // Key shaft
    const shaftGeometry = new THREE.BoxGeometry(1, 0.1, 0.1)
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
    shaft.position.x = 0.5
    keyGroup.add(shaft)

    // Key teeth
    for (let i = 0; i < 3; i++) {
      const toothGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1)
      const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
      tooth.position.set(0.3 + i * 0.3, -0.15, 0)
      keyGroup.add(tooth)
    }

    keyGroup.position.set(-1.5, 0, 0)
    keyRef.current = keyGroup
    sceneRef.current.add(keyGroup)

    // Create lock
    const lockGroup = new THREE.Group()

    // Lock body
    const lockBodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.4)
    const lockBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b })
    const lockBody = new THREE.Mesh(lockBodyGeometry, lockBodyMaterial)
    lockGroup.add(lockBody)

    // Lock shackle
    const shackleGeometry = new THREE.TorusGeometry(0.3, 0.08, 16, 32, Math.PI)
    const shackleMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b })
    const shackle = new THREE.Mesh(shackleGeometry, shackleMaterial)
    shackle.position.y = 0.5
    shackle.rotation.x = Math.PI / 2
    lockGroup.add(shackle)

    // Lock keyhole
    const keyholeGeometry = new THREE.CircleGeometry(0.1, 32)
    const keyholeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial)
    keyhole.position.set(0, 0, 0.21)
    lockGroup.add(keyhole)

    lockGroup.position.set(1.5, 0, 0)
    lockRef.current = lockGroup
    sceneRef.current.add(lockGroup)
  }

  const createPgpObjects = () => {
    if (!sceneRef.current) return

    // Create an envelope for PGP
    const envelopeGroup = new THREE.Group()

    // Envelope body
    const envelopeGeometry = new THREE.BoxGeometry(2, 1.5, 0.1)
    const envelopeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    const envelope = new THREE.Mesh(envelopeGeometry, envelopeMaterial)
    envelopeGroup.add(envelope)

    // Envelope flap
    const flapGeometry = new THREE.BufferGeometry()
    const flapVertices = new Float32Array([
      -1,
      0.75,
      0.05, // top left
      1,
      0.75,
      0.05, // top right
      0,
      0,
      0.05, // bottom center
    ])
    flapGeometry.setAttribute("position", new THREE.BufferAttribute(flapVertices, 3))
    flapGeometry.computeVertexNormals()

    const flapMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
    const flap = new THREE.Mesh(flapGeometry, flapMaterial)
    envelopeGroup.add(flap)

    // Seal
    const sealGeometry = new THREE.CircleGeometry(0.3, 32)
    const sealMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 })
    const seal = new THREE.Mesh(sealGeometry, sealMaterial)
    seal.position.set(0, 0, 0.06)
    seal.rotation.x = Math.PI
    envelopeGroup.add(seal)

    lockRef.current = envelopeGroup
    sceneRef.current.add(envelopeGroup)
  }

  const createTlsObjects = () => {
    if (!sceneRef.current) return

    // Create a padlock for TLS
    const padlockGroup = new THREE.Group()

    // Padlock body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.6)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xec4899 })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    padlockGroup.add(body)

    // Padlock shackle
    const shackleGeometry = new THREE.TorusGeometry(0.4, 0.1, 16, 32, Math.PI)
    const shackleMaterial = new THREE.MeshStandardMaterial({ color: 0xd946ef })
    const shackle = new THREE.Mesh(shackleGeometry, shackleMaterial)
    shackle.position.y = 0.75
    shackle.rotation.x = Math.PI / 2
    padlockGroup.add(shackle)

    // Padlock keyhole
    const keyholeGeometry = new THREE.CircleGeometry(0.15, 32)
    const keyholeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial)
    keyhole.position.set(0, 0, 0.31)
    padlockGroup.add(keyhole)

    // Add SSL certificate icon
    const certGeometry = new THREE.PlaneGeometry(0.8, 0.8)
    const certMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    })
    const cert = new THREE.Mesh(certGeometry, certMaterial)
    cert.position.set(0, 0.3, 0.31)
    padlockGroup.add(cert)

    const checkGeometry = new THREE.BufferGeometry()
    const checkVertices = new Float32Array([
      -0.2,
      0.3,
      0.32, // start
      -0.1,
      0.2,
      0.32, // middle
      0.2,
      0.5,
      0.32, // end
    ])
    checkGeometry.setAttribute("position", new THREE.BufferAttribute(checkVertices, 3))

    const checkMaterial = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })
    const check = new THREE.Line(checkGeometry, checkMaterial)
    padlockGroup.add(check)

    lockRef.current = padlockGroup
    sceneRef.current.add(padlockGroup)
  }

  const createDefaultObjects = () => {
    if (!sceneRef.current) return

    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.7,
    })

    const sphere = new THREE.Mesh(geometry, material)
    lockRef.current = sphere
    sceneRef.current.add(sphere)
  }

  return <div ref={containerRef} className="w-full h-full" />
}