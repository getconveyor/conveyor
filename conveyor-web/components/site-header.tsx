"use client";

import { useState } from "react";
import {
  IconCreditCard,
  IconHelp,
  IconLogout,
  IconNotification,
  IconSearch,
  IconUserCircle,
  IconSettings,
  IconKey,
  IconLock,
  IconPalette,
  IconCommand,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { useAuth } from "@/contexts/auth-context";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";

export function SiteHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <WorkspaceSwitcher />
        <div className="ml-auto flex items-center gap-2">
          {/* Command Palette Trigger */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground"
            onClick={() => setCommandOpen(true)}
          >
            <IconSearch className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCommandOpen(true)}
          >
            <IconSearch className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Link href="/help">
            <Button variant="ghost" size="icon">
              <IconHelp className="h-5 w-5" />
              <span className="sr-only">Get Help</span>
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user.avatar || undefined}
                    alt={user.full_name}
                  />
                  <AvatarFallback>
                    {user.full_name
                      ? user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href="/settings/profile">
                  <DropdownMenuItem>
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings/security">
                  <DropdownMenuItem>
                    <IconLock className="mr-2 h-4 w-4" />
                    <span>Security</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings/api-keys">
                  <DropdownMenuItem>
                    <IconKey className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings/preferences">
                  <DropdownMenuItem>
                    <IconPalette className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href="/workspace/settings/general">
                  <DropdownMenuItem>
                    <IconSettings className="mr-2 h-4 w-4" />
                    <span>Workspace Settings</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/workspace/settings/members">
                  <DropdownMenuItem>
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    <span>Team Members</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
}
