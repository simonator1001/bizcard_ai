"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  User, 
  LogIn, 
  ChevronDown, 
  Menu, 
  Maximize, 
  Sun, 
  Moon 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/lib/auth-context'

interface NavItem {
  text: string
  to?: string
  items?: {
    text: string
    description?: string
    to: string
  }[]
}

interface HeaderProps {
  className?: string
  theme?: 'light' | 'dark'
  isSticky?: boolean
  isStickyOverlay?: boolean
  withBorder?: boolean
  logo?: React.ReactNode
  menuItems?: NavItem[]
  onThemeChange?: () => void
  rightContent?: React.ReactNode
}

const ChevronIcon = () => (
  <ChevronDown className="h-4 w-4 opacity-60" />
)

const Navigation: React.FC<{ items: NavItem[] }> = ({ items }) => (
  <nav className="hidden md:block">
    <ul className="flex gap-x-8">
      {items.map(({ to, text, items }, index) => {
        const Tag = to ? 'a' : 'button'
        const hasSubItems = Array.isArray(items) && items.length > 0;
        return (
          <li
            className={cn('relative [perspective:2000px]', hasSubItems && 'group')}
            key={index}
          >
            <Tag
              className="flex items-center gap-x-1 whitespace-pre text-sm text-foreground"
              href={to}
            >
              {text}
              {hasSubItems && <ChevronIcon />}
            </Tag>
            {hasSubItems && (
              <div
                className={cn(
                  'absolute -left-5 top-full w-[300px] pt-5',
                  'pointer-events-none opacity-0',
                  'origin-top-left transition-[opacity,transform] duration-200 [transform:rotateX(-12deg)_scale(0.9)]',
                  'group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:[transform:none]'
                )}
              >
                <ul
                  className="relative flex min-w-[248px] flex-col gap-y-0.5 rounded-xl border border-border bg-background p-2.5 shadow-lg"
                >
                  {items && items.map(({ text, description, to }, index) => (
                    <li key={index}>
                      <a
                        className="group/link relative flex items-center overflow-hidden whitespace-nowrap rounded-lg p-2 hover:bg-muted"
                        href={to}
                      >
                        <div className="relative z-10 ml-1">
                          <span className="block text-sm font-medium text-foreground">{text}</span>
                          {description && (
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {description}
                            </span>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  </nav>
)

export const Header: React.FC<HeaderProps> = ({
  className,
  theme = 'light',
  isSticky = true,
  isStickyOverlay = true,
  withBorder = true,
  logo = <span className="text-xl font-bold">Logo</span>,
  menuItems = [],
  onThemeChange,
  rightContent,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const router = useRouter();
  const { user, signOut } = useAuth();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }

  return (
    <header
      className={cn(
        'relative z-40 w-full bg-background',
        isSticky && 'sticky top-0',
        isStickyOverlay && 'backdrop-blur-md',
        withBorder && 'border-b border-border',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            {logo}
          </div>
          
          <div className="flex-1 flex justify-center">
            <Navigation items={menuItems} />
          </div>
          
          <div className="flex items-center gap-x-4">
            {rightContent}
            
            {user ? (
              <Button variant="outline" size="sm" onClick={signOut}>
                <User className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/signin')}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
            
            <Button size="sm">
              Get Started
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleFullscreen}
              className="hidden sm:flex"
            >
              <Maximize className="h-5 w-5" />
            </Button>
            
            {onThemeChange && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onThemeChange}
                className="hidden sm:flex"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 pt-6">
                  {menuItems.map((item, index) => (
                    <div key={index} className="flex flex-col gap-3">
                      {item.to ? (
                        <a href={item.to} className="text-lg font-medium">
                          {item.text}
                        </a>
                      ) : (
                        <span className="text-lg font-medium">{item.text}</span>
                      )}
                      
                      {item.items && (
                        <div className="flex flex-col gap-2 pl-4">
                          {item.items.map((subItem, subIndex) => (
                            <a 
                              key={subIndex} 
                              href={subItem.to}
                              className="text-sm text-muted-foreground hover:text-foreground"
                            >
                              {subItem.text}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex flex-col gap-3 pt-6">
                    {user ? (
                      <Button variant="outline" className="w-full" onClick={signOut}>
                        <User className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => router.push('/signin')}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    )}
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

// Example usage
const HeaderExample = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  
  const menuItems = [
    {
      text: "Products",
      items: [
        {
          text: "Analytics",
          description: "Measure and optimize performance",
          to: "/products/analytics",
        },
        {
          text: "Engagement",
          description: "Connect with your audience",
          to: "/products/engagement",
        }
      ]
    },
    {
      text: "Solutions",
      to: "/solutions"
    },
    {
      text: "Resources",
      items: [
        {
          text: "Documentation",
          description: "Guides and references",
          to: "/resources/docs",
        },
        {
          text: "Blog",
          description: "Latest news and updates",
          to: "/resources/blog",
        }
      ]
    },
    {
      text: "Pricing",
      to: "/?tab=pricing"
    }
  ]
  
  return (
    <Header
      theme={theme}
      menuItems={menuItems}
      onThemeChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      logo={<span className="text-xl font-bold">MyApp</span>}
    />
  )
}

export default HeaderExample 