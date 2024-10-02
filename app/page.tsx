import React from "react";
import Editor from "./components/Editor";

export default function Home() {
  return (
    <>
      <Editor />
      <footer className="w-full bg-gray-900 text-gray-400 py-4  bottom-0">
      <div className="container mx-auto flex justify-center gap-4 items-center px-4">
        <a
          href="https://github.com/theabhayprajapati/ende-forge"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400 transition-colors duration-300"
        >
          @github
        </a>

        <a
          href="https://x.com/abhayprajapati_"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400 transition-colors duration-300"
        >
          @abhayprajapati_
        </a>
      </div>
    </footer>
    </>
  );
}
