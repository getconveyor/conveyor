"use client"

import { useState } from "react"
import { IconBook, IconCheck, IconChevronDown, IconPlus, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Notebook {
  id: string
  name: string
  description: string
  kernel: string
  language: string
}

interface NotebookSelectorProps {
  notebooks: Notebook[]
  selectedNotebookId?: string
  onSelect: (notebookId: string | undefined) => void
  filterLanguage?: "python" | "sql"
  placeholder?: string
  className?: string
}

export function NotebookSelector({
  notebooks,
  selectedNotebookId,
  onSelect,
  filterLanguage,
  placeholder = "Select notebook...",
  className,
}: NotebookSelectorProps) {
  const [open, setOpen] = useState(false)

  const filteredNotebooks = filterLanguage
    ? notebooks.filter((nb) => nb.language === filterLanguage)
    : notebooks

  const selectedNotebook = notebooks.find((nb) => nb.id === selectedNotebookId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className || ""}`}
        >
          {selectedNotebook ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <IconBook className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{selectedNotebook.name}</span>
              <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
                {selectedNotebook.kernel}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search notebooks..." />
          <CommandList>
            <CommandEmpty>No notebook found.</CommandEmpty>
            <CommandGroup>
              {filteredNotebooks.map((notebook) => (
                <CommandItem
                  key={notebook.id}
                  value={notebook.name}
                  onSelect={() => {
                    onSelect(notebook.id === selectedNotebookId ? undefined : notebook.id)
                    setOpen(false)
                  }}
                >
                  <IconCheck
                    className={`mr-2 h-4 w-4 ${
                      selectedNotebookId === notebook.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{notebook.name}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {notebook.kernel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {notebook.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <IconPlus className="mr-2 h-4 w-4" />
            Create new notebook
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
