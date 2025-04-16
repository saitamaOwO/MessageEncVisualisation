"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { editor } from "monaco-editor"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  width?: string
  readOnly?: boolean
  className?: string
}

export default function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  height = "300px",
  width = "100%",
  readOnly = false,
  className,
}: MonacoEditorProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)
  const monacoEl = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      import("monaco-editor").then((monaco) => {
        if (monacoEl.current) {
          monacoRef.current = monaco;
          
          const editorInstance = monaco.editor.create(monacoEl.current, {
            value,
            language,
            theme: "vs-dark",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            readOnly,
            automaticLayout: true,
            fontSize: 14,
            lineNumbers: "on",
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          })

          editorInstance.onDidChangeModelContent(() => {
            onChange(editorInstance.getValue())
          })

          editorRef.current = editorInstance
          setIsLoaded(true)
        }
      })
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  }, [])  // Keep this dependency array empty to avoid recreation

  // Handle prop changes separately
  useEffect(() => {
    if (editorRef.current) {
      // Only update value if it differs from the editor's value
      // and the editor doesn't have focus (to avoid cursor jumping)
      const currentValue = editorRef.current.getValue()
      if (value !== currentValue && !editorRef.current.hasTextFocus()) {
        editorRef.current.setValue(value)
      }
    }
  }, [value])

  // Update editor options when props change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly
      })
      
      // Update the language by changing the model
      if (monacoRef.current && editorRef.current.getModel()) {
        monacoRef.current.editor.setModelLanguage(editorRef.current.getModel()!, language)
      }
    }
  }, [language, readOnly])

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {!isLoaded && <Skeleton className={cn("", height)} />}
      <div ref={monacoEl} style={{ height, width }} />
    </div>
  )
}