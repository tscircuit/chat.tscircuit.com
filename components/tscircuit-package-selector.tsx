"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import { FileIcon } from "./icons"

interface FileSelectorProps {
  isOpen: boolean
  onClose: ({ refocusInput }: { refocusInput: boolean }) => void
  onSelect: (filename: string) => void
  triggerPos: { x: number; y: number }
  files: Array<{ name: string; type: string }>
}

export default function TscircuitPackageSelector({
  isOpen,
  onClose,
  onSelect,
  triggerPos,
  files,
}: FileSelectorProps) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the selector opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      setSearch("")
    }
  }, [isOpen])

  const filteredFiles = useMemo(() => {
    if (search) {
      return files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return files
  }, [search, files])

  if (!isOpen) return null

  return (
    <div
      className="absolute z-50 w-[300px] bg-popover text-popover-foreground shadow-md rounded-lg border"
      style={{
        top: triggerPos.y + 50,
        left: triggerPos.x,
      }}
    >
      <Command
        shouldFilter={false}
        onKeyDown={(e) => {
          if (e.key === "Escape" || (e.key === "Backspace" && !search)) {
            e.preventDefault()
            onClose({ refocusInput: true })
          }
        }}
      >
        <CommandInput
          ref={inputRef}
          placeholder="Search packages..."
          value={search}
          onValueChange={(newSearch) => {
            setSearch(newSearch)
          }}
        />
        <CommandList>
          <CommandEmpty>No packages found.</CommandEmpty>
          <CommandGroup>
            {filteredFiles.map((file) => (
              <CommandItem
                key={file.name}
                onSelect={() => {
                  onSelect(file.name)
                  onClose({ refocusInput: true })
                }}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
              >
                <FileIcon />
                <span>{file.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
