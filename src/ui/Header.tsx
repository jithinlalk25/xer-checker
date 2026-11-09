import { BookOpen, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from './primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu';
import { useTheme, type ThemePreference } from './themeContext';

export function Header({ onOpenHowItWorks }: { onOpenHowItWorks: () => void }) {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          XER Checker
        </a>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onOpenHowItWorks}>
            <BookOpen /> How this works
          </Button>
          <ThemeMenu />
        </nav>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <rect width="24" height="24" rx="6" className="fill-foreground" />
      <rect x="5" y="6" width="9" height="3" rx="1.5" className="fill-background" />
      <rect x="5" y="10.5" width="14" height="3" rx="1.5" className="fill-background" />
      <rect x="5" y="15" width="6" height="3" rx="1.5" className="fill-background" />
    </svg>
  );
}

function ThemeMenu() {
  const { preference, resolved, setPreference } = useTheme();
  const Icon = resolved === 'dark' ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={preference} onValueChange={(v) => setPreference(v as ThemePreference)}>
          <DropdownMenuRadioItem value="light">
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
