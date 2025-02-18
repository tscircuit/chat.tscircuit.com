import React, { useState, useEffect, useRef } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command"
import { FileIcon } from "@/components/icons"

interface FileSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (filename: string) => void
  triggerPos: { x: number; y: number }
  files: Array<{ name: string; type: string }>
}

export default function FileSelector({
  isOpen,
  onClose,
  onSelect,
  triggerPos,
  files,
}: FileSelectorProps) {
  const [search, setSearch] = useState("")
  const [filteredFiles, setFilteredFiles] = useState(files)

  useEffect(() => {
    if (search) {
      setFilteredFiles(
        files.filter((file) =>
          file.name.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    } else {
      setFilteredFiles(files)
    }
  }, [search, files])

  if (!isOpen) return null

  return (
    <div
      className="absolute z-50 w-[300px] bg-popover text-popover-foreground shadow-md rounded-lg border"
      style={{
        top: triggerPos.y + 24,
        left: triggerPos.x,
      }}
    >
      <Command>
        <CommandInput
          placeholder="Search files..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No files found.</CommandEmpty>
          <CommandGroup>
            {filteredFiles.map((file) => (
              <CommandItem
                key={file.name}
                onSelect={() => {
                  onSelect(file.name)
                  onClose()
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
