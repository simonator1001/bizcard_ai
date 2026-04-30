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
import { Facebook, Instagram, Linkedin, Send, Twitter } from "lucide-react"
import NewsletterForm from "@/components/ui/newsletter-form"
import Link from "next/link"

function Footerdemo() {
  return (
    <footer className="relative border-t bg-gradient-to-br from-primary/10 via-secondary/10 to-muted/20 text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-primary">Stay Connected</h2>
            <p className="mb-6 text-muted-foreground">
              Join our newsletter for the latest updates and exclusive offers.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-primary">Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <Link href="/" className="block transition-colors hover:text-primary">Home</Link>
              <Link href="/about" className="block transition-colors hover:text-primary">About</Link>
              <Link href="/features" className="block transition-colors hover:text-primary">Features</Link>
              <Link href="/pricing" className="block transition-colors hover:text-primary">Pricing</Link>
              <Link href="/contact" className="block transition-colors hover:text-primary">Contact</Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-primary">Contact</h3>
            <address className="space-y-2 text-sm not-italic">
              <p>Contact us for inquiries</p>
              <p>Available worldwide</p>
              <p>
                <a href="mailto:support@bizcard.ai" className="transition-colors hover:text-primary">
                  support@bizcard.ai
                </a>
              </p>
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
            © 2026 Simon.AI BizCard. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm">
            <Link href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-primary">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo } 