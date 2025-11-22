"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  selectedIndex?: number | null;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  selectedIndex = null,
}: ExpandableTabsProps) {
  const outsideClickRef = React.useRef(null);

  useOnClickOutside(outsideClickRef, () => {
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex items-center gap-2 px-6 py-2 rounded-[2.5rem] bg-[#292929] shadow-2xl",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        if (!Icon) return null;
        const isSelected = selectedIndex === index;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              "flex items-center justify-center px-2 py-1 rounded-2xl transition-all duration-300 focus:outline-none",
              isSelected
                ? "bg-gradient-to-r from-[#a259c6] to-[#d946ef] shadow-lg px-6 py-3"
                : "bg-transparent"
            )}
            style={{ minWidth: isSelected ? 120 : 56, minHeight: 56 }}
          >
            <Icon size={32} className={isSelected ? "text-white" : "text-[#cbd5e1]"} />
            {isSelected && (
              <span className="ml-3 text-2xl font-extrabold text-black select-none">
                {tab.title}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
} 