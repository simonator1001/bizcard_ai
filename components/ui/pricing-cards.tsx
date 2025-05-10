import { Check, MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tab } from "@/components/ui/pricing-tab";
import * as React from "react";

const FREQUENCIES = ["monthly", "yearly"] as const;
type Frequency = typeof FREQUENCIES[number];
const STRIPE_LINKS: Record<Frequency, string> = {
  monthly: "https://buy.stripe.com/test_bIY3eN9mh9hv95SbIJ",
  yearly: "https://buy.stripe.com/test_dR6aHf41X51fbe07su",
};
const ADVANCE_PRICES: Record<Frequency, number> = {
  monthly: 9.99,
  yearly: 95.99, // 20% off from 9.99*12 = 119.88
};

export function Pricing() {
  const [selected, setSelected] = React.useState<Frequency>(FREQUENCIES[0]);
  const isYearly = selected === "yearly";

  return (
    <div className="w-full py-20 lg:py-32 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-6 text-center mb-12">
          <Badge className="mb-2">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-200/90 max-w-2xl">
            Choose the plan that fits your business. Upgrade anytime.
          </p>
          <div className="flex w-fit rounded-full bg-muted p-1 mt-4">
            {FREQUENCIES.map((frequency) => (
              <Tab
                key={frequency}
                text={frequency}
                selected={selected === frequency}
                setSelected={(text) => setSelected(text as Frequency)}
                discount={frequency === "yearly"}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-stretch max-w-4xl mx-auto">
          {/* Basic Plan */}
          <Card className="w-full rounded-2xl border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl flex flex-col justify-between">
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal text-white text-2xl">
                  Basic
                </span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                For individuals and small teams getting started with digital business card management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8 justify-start">
                <p className="flex flex-row items-end gap-2 text-4xl font-extrabold text-white">
                  $0
                  <span className="text-base text-slate-400 font-medium mb-1">/ month</span>
                </p>
                <div className="flex flex-col gap-4 justify-start">
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Scan up to 10 cards/month</p>
                      <p className="text-slate-400 text-sm">Basic OCR (English only)</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Basic card management</p>
                      <p className="text-slate-400 text-sm">Add, edit, and delete cards</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Limited news feed</p>
                      <p className="text-slate-400 text-sm">See updates from your contacts</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="gap-4 mt-6" disabled>
                  Free Plan
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Advance Plan */}
          <Card className="w-full rounded-2xl border-primary bg-gradient-to-br from-purple-800 to-pink-900 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-6 top-6">
              {isYearly && (
                <Badge variant="secondary" className="bg-pink-600 text-white font-bold shadow-lg">20% OFF</Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal text-white text-2xl">
                  Advance
                </span>
              </CardTitle>
              <CardDescription className="text-slate-200">
                Unlock all features for professionals and teams who need more power and flexibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8 justify-start">
                <p className="flex flex-row items-end gap-2 text-4xl font-extrabold text-white">
                  ${ADVANCE_PRICES[selected]}
                  <span className="text-base text-slate-300 font-medium mb-1">/ {isYearly ? "year" : "month"}</span>
                </p>
                <div className="flex flex-col gap-4 justify-start">
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Unlimited card scans</p>
                      <p className="text-slate-300 text-sm">Advanced OCR (multi-language)</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>AI-powered categorization</p>
                      <p className="text-slate-300 text-sm">Smart tags and filters</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Team collaboration</p>
                      <p className="text-slate-300 text-sm">Share cards and notes with your team</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Custom branding & API access</p>
                      <p className="text-slate-300 text-sm">Integrate with your internal tools</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Advanced analytics & reporting</p>
                      <p className="text-slate-300 text-sm">Track usage and engagement</p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-5 h-5 mt-1 text-emerald-400" />
                    <div className="flex flex-col">
                      <p>Dedicated support & onboarding</p>
                      <p className="text-slate-300 text-sm">Priority response and training</p>
                    </div>
                  </div>
                </div>
                <Button
                  className="gap-4 mt-6 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-lg font-bold py-3 shadow-lg border-0"
                  asChild
                >
                  <a href={STRIPE_LINKS[selected]} target="_blank" rel="noopener noreferrer">
                    {isYearly ? "Subscribe Annually" : "Subscribe Monthly"} <MoveRight className="w-5 h-5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 