"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Moon, Send, Sun, Twitter } from "lucide-react"

function Footerdemo() {
  const [isDarkMode, setIsDarkMode] = React.useState(true)
  const [isChatOpen, setIsChatOpen] = React.useState(false)

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return (
    <footer className="relative border-t bg-gradient-to-br from-primary/10 via-secondary/10 to-muted/20 text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-primary">Stay Connected</h2>
            <p className="mb-6 text-muted-foreground">
              Join our newsletter for the latest updates and exclusive offers.
            </p>
            <form className="relative flex items-center bg-white/70 dark:bg-zinc-900/70 rounded-full shadow-sm overflow-hidden">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 border-0 bg-transparent px-4 py-2 text-sm focus:ring-0"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-primary text-primary-foreground m-1 shadow-none hover:scale-105 transition-transform"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-primary">Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block transition-colors hover:text-primary">Home</a>
              <a href="#" className="block transition-colors hover:text-primary">About</a>
              <a href="#" className="block transition-colors hover:text-primary">Features</a>
              <a href="#" className="block transition-colors hover:text-primary">Pricing</a>
              <a href="#" className="block transition-colors hover:text-primary">Contact</a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-primary">Contact</h3>
            <address className="space-y-2 text-sm not-italic">
              <p>123 Innovation Street</p>
              <p>Tech City, TC 12345</p>
              <p>Phone: (123) 456-7890</p>
              <p>Email: hello@example.com</p>
            </address>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold text-primary">Follow Us</h3>
            <div className="mb-6 flex space-x-3">
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/10">
                <Facebook className="h-4 w-4 text-primary" />
                      <span className="sr-only">Facebook</span>
                    </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/10">
                <Twitter className="h-4 w-4 text-primary" />
                      <span className="sr-only">Twitter</span>
                    </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/10">
                <Instagram className="h-4 w-4 text-primary" />
                      <span className="sr-only">Instagram</span>
                    </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/10">
                <Linkedin className="h-4 w-4 text-primary" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 Simon.AI BizCard. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="#" className="transition-colors hover:text-primary">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-primary">Terms</a>
            <a href="#" className="transition-colors hover:text-primary">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo } 