"use client";
import React, { useEffect, useState } from "react";
import Editor from "./components/Editor";
import { cn } from "@/lib/utils";

export default function Home() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const threshold = 100; // pixels from bottom to trigger footer

      // Show footer when near bottom of page
      setShowFooter(scrollPosition > documentHeight - threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="flex-1 min-h-screen">
      <Editor />
      <footer 
        className={cn(
          "fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
          showFooter ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/theabhayprajapati/ende-forge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              @github
            </a>
            <a
              href="https://x.com/abhayprajapati_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              @abhayprajapati_
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
