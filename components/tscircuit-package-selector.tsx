import React, { useState, useEffect, useRef } from "react"
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
import { StarIcon } from "lucide-react"

interface Package {
  name: string
  package_id: string
  owner_github_username: string
  star_count: number
}

interface TscircuitPackageSelectorProps {
  isOpen: boolean
  onClose: ({ refocusInput }: { refocusInput: boolean }) => void
  onSelect: (packageName: string) => void
  triggerPos: { x: number; y: number }
}

export default function TscircuitPackageSelector({
  isOpen,
  onClose,
  onSelect,
  triggerPos,
}: TscircuitPackageSelectorProps) {
  const [search, setSearch] = useState("")
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    if (!search) {
      setPackages([])
      return
    }

    const fetchPackages = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          "https://registry-api.tscircuit.com/packages/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: search }),
          },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch packages")
        }

        const data = await response.json()
        setPackages(data.packages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setPackages([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchPackages, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      setSearch("")
      setPackages([])
      setError(null)
    }
  }, [isOpen])

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={() => onClose({ refocusInput: true })}
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
          onValueChange={setSearch}
        />
        <CommandList>
          {error && (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          )}
          <CommandEmpty>No packages found.</CommandEmpty>
          <CommandGroup>
            {packages.map((pkg) => (
              <CommandItem
                key={pkg.package_id}
                onSelect={() => {
                  onSelect(pkg.name)
                  onClose({ refocusInput: true })
                }}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
              >
                <FileIcon />
                <div className="flex flex-col">
                  <span className="font-medium text-black">{pkg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    by {pkg.owner_github_username}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{pkg.star_count}</span>
                  <StarIcon size="xs" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
