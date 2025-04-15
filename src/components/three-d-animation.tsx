"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface ThreeDAnimationProps {
  method: string
  encryptionInProgress: boolean
}

export default function ThreeDAnimation({ method, encryptionInProgress }: ThreeDAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const lockRef = useRef<THREE.Object3D | null>(null)
  const keyRef = useRef<THREE.Group | null>(null)

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
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
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
  }, [])

  // Update when method changes
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
  }, [method])

  const createMethodSpecificObjects = (method: string) => {
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
    let particleColor
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
  }

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
    handle.position.set(0, 0, 0)
    keyGroup.add(handle)

    // Key teeth
    const teethGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1)
    const teethMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 })
    const teeth = new THREE.Mesh(teethGeometry, teethMaterial)
    teeth.position.set(0, 0.2, 0)
    keyGroup.add(teeth)

    keyRef.current = keyGroup
    sceneRef.current.add(keyGroup)
  }

  const createPgpObjects = () => {
    if (!sceneRef.current) return

    // Create a group of particles representing PGP
    const pgpGroup = new THREE.Group()
    // Create particles...
    // Add particles to the group...

    sceneRef.current.add(pgpGroup)
  }

  const createTlsObjects = () => {
    if (!sceneRef.current) return

    // Create a grid representing TLS
    const tlsGroup = new THREE.Group()
    // Create grid...
    // Add grid to the group...

    sceneRef.current.add(tlsGroup)
  }

  const createDefaultObjects = () => {
    // Default objects or fallback if no method
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100vh" }}></div>
  )
}
