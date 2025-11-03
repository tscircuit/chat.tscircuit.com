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
import {
  StarIcon,
  Loader2,
  Package,
  AlertCircle,
  CircuitBoardIcon,
} from "lucide-react"

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
          "https://api.tscircuit.com/packages/search",
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
        setPackages(data.packages || [])
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

  const handlePackageSelect = (packageName: string) => {
    onSelect(packageName)
    onClose({ refocusInput: true })
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={() => onClose({ refocusInput: true })}
      title="TSCircuit Package Selector"
      aria-describedby="package-selector-description"
    >
      <div id="package-selector-description" className="sr-only">
        Search and select TSCircuit packages from the registry. Use arrow keys
        to navigate, Enter to select, and Escape to close.
      </div>
      <Command
        shouldFilter={false}
        onKeyDown={(e) => {
          if (e.key === "Escape" || (e.key === "Backspace" && !search)) {
            e.preventDefault()
            onClose({ refocusInput: true })
          }
        }}
        className="relative bg-background text-foreground"
      >
        <div className="flex items-center border-b border-border px-3">
          <CommandInput
            ref={inputRef}
            placeholder="Search TSCircuit packages..."
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          {isLoading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <CommandList className="max-h-[400px] min-h-[200px] bg-background">
          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive mb-1">
                Search Error
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && search && packages.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">
                  No packages found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try different keywords
                </p>
              </div>
            </CommandEmpty>
          )}

          {/* Welcome State */}
          {!search && !isLoading && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Search TSCircuit Packages
              </p>
              <p className="text-xs text-muted-foreground">
                Find components, libraries, and more
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 mb-2 animate-pulse"
                >
                  <div className="rounded bg-muted h-8 w-8"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-5 w-10 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {packages.length > 0 && !isLoading && (
            <CommandGroup className="p-1">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50 mb-1 no-scrollbar">
                {packages.length} package{packages.length !== 1 ? "s" : ""}{" "}
                found
              </div>
              {packages.map((pkg) => (
                <CommandItem
                  key={pkg.package_id}
                  value={pkg.name}
                  onSelect={() => handlePackageSelect(pkg.name)}
                  className="package-item mx-1 my-0.5 p-3 rounded-md cursor-pointer bg-background hover:bg-accent  aria-selected:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Package Icon */}
                    <div className="shrink-0">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <CircuitBoardIcon />
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium opacity-100! text-foreground text-sm truncate">
                          {pkg.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        by {pkg.owner_github_username}
                      </div>
                    </div>

                    {/* Star Count */}
                    <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <StarIcon size={12} />
                      <span className="font-medium">
                        {pkg.star_count > 1000
                          ? `${Math.floor(pkg.star_count / 1000)}k`
                          : pkg.star_count}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Footer */}
          {packages.length > 0 && (
            <div className="border-t z-99 border-border p-2 bg-muted rounded-b-md mt-1 absolute bottom-0 left-0 right-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <kbd>↑↓</kbd> Navigate
                  <kbd>↵</kbd> Select
                  <kbd>Esc</kbd> Close
                </div>
                <span className="hidden sm:block">TSCircuit Registry</span>
              </div>
            </div>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
