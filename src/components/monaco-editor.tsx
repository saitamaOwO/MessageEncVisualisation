"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  width?: string  // Add width as a customizable prop
  readOnly?: boolean
  className?: string
}

export default function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  height = "300px",
  width = "100%", // Default to 100% width, but this can be changed
  readOnly = false,
  className,
}: MonacoEditorProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [editor, setEditor] = useState<any>(null)
  const monacoEl = useRef(null)

  useEffect(() => {
    if (monacoEl.current && !editor) {
      import("monaco-editor").then((monaco) => {
        const editorInstance = monaco.editor.create(monacoEl.current!, {
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

        setEditor(editorInstance)
        setIsLoaded(true)

        return () => {
          editorInstance.dispose()
        }
      })
    }

    return () => {
      if (editor) {
        editor.dispose()
      }
    }
  }, [monacoEl, editor])

  useEffect(() => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value)
    }
  }, [editor, value])

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {!isLoaded && <Skeleton className={cn("", height)} />} {/* Remove w-full class */}
      <div ref={monacoEl} style={{ height, width }} />
    </div>
  )
}
