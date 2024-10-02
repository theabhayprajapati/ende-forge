"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDownIcon,
  TrashIcon,
  CopyIcon,
  ClipboardIcon,
  MoveRightIcon,
} from "lucide-react";

interface Converter {
  id: string;
  name: string;
  convert: (input: string) => string;
}

const converters: {
  encode: Converter[];
  decode: Converter[];
} = {
  encode: [
    {
      id: "base64",
      name: "Base64 Encode",
      convert: (input: string) => btoa(input),
    },
    {
      id: "uri",
      name: "URI Encode",
      convert: (input: string) => encodeURIComponent(input),
    },
    {
      id: "json",
      name: "JSON Stringify",
      convert: (input: string) => JSON.stringify(input),
    },
  ],
  decode: [
    {
      id: "base64-decode",
      name: "Base64 Decode",
      convert: (input: string) => atob(input),
    },
    {
      id: "uri-decode",
      name: "URI Decode",
      convert: (input: string) => decodeURIComponent(input),
    },
  ],
};

export function detectTextFormat(content: string): string {
  // Trim whitespace and remove BOM if present
  content = content.trim().replace(/^\uFEFF/, "");

  // Check for empty content
  if (content.length === 0) {
    return "Empty file";
  }

  // Check for JSON
  if (/^\s*[\{\[]/.test(content) && /[\}\]]\s*$/.test(content)) {
    try {
      JSON.parse(content);
      return "JSON";
    } catch (e) {
      console.error(e);
      // Not valid JSON, continue checking
    }
  }

  // Check for XML or HTML
  if (/^\s*<[\s\S]*>/.test(content)) {
    if (/<(!DOCTYPE|html|head|body)/i.test(content)) {
      return "HTML";
    }
    return "XML";
  }

  // Check for CSS
  if (/^\s*(\S+\s*{[^}]*}|@\w+|@import\s+)/i.test(content)) {
    return "CSS";
  }

  // Check for JavaScript
  if (
    /^\s*(var|let|const|function|class|import|export|async|await|=>\s*{)/m.test(
      content
    )
  ) {
    return "JavaScript";
  }

  // Check for TypeScript
  if (
    /^\s*(interface|type|namespace|enum|declare|abstract class)/m.test(content)
  ) {
    return "TypeScript";
  }

  // Check for Python
  if (
    /^\s*(def|class|import|from|if __name__ == ['"]__main__['"]:)/m.test(
      content
    )
  ) {
    return "Python";
  }

  // Check for Java
  if (
    /^\s*(public|private|protected|class|interface|enum|package|import java)/m.test(
      content
    )
  ) {
    return "Java";
  }

  // Check for YAML
  if (/^\s*(\w+:|---)/m.test(content)) {
    return "YAML";
  }

  // Check for Markdown
  if (/^#\s|\n#{1,6}\s|(?:^|\n)(?:[*-+]|\d+\.)\s/.test(content)) {
    return "Markdown";
  }

  // Check for Base64
  if (/^[A-Za-z0-9+/]*={0,2}$/.test(content)) {
    return "Base64";
  }

  // Check for URL-encoded
  if (/^(?:[^=&]+=?)*(?:&(?:[^=&]+=?)*)*$/.test(content)) {
    return "URL-encoded";
  }

  // Check for CSV
  if (
    /^(?:[^,\n"]*|"(?:[^"]|"")*")(?:,(?:[^,\n"]*|"(?:[^"]|"")*"))*(?:\n|$)/.test(
      content
    )
  ) {
    return "CSV";
  }

  // If no specific format is detected
  return "Plain text";
}

export default function Editor() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [flow, setFlow] = useState<Converter[]>([]);
  const [mode, setMode] = useState<"encode" | "decode">("decode");
  const [showUtilityButtons] = useState<boolean>(true);

  const toggleMode = () => {
    setMode(mode === "encode" ? "decode" : "encode");
  };

  const addToFlow = (converterId: string) => {
    if (!converterId) return;
    const converter = converters[mode].find((c) => c.id === converterId);
    if (converter) {
      setFlow([...flow, converter]);
    }
  };
 
  const removeFromFlow = (index: number) => {
    setFlow(flow.filter((_, i) => i !== index));
  };

  const handleConvert = () => {
    try {
      let result = input;
      flow.forEach((step) => {
        result = step.convert(result);
      });
      setOutput(result);
    } catch (error) {
      console.log(error);
      setOutput("Error: Invalid conversion");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => setInput(text));
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">
        ENDE Forge
      </h1>

      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex space-x-2 items-center">
          <button
            onClick={toggleMode}
            className={`py-2 px-4 rounded font-semibold ${
              mode === "encode" ? "bg-blue-600" : "bg-purple-600"
            } hover:opacity-80`}
          >
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
          <div className="relative flex-grow">
            <select
              className="w-full p-2 bg-gray-700 rounded appearance-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              onChange={(e) => addToFlow(e.target.value)}
              value=""
            >
              <option value="">Select a {mode} converter</option>
              {converters[mode].map((converter) => (
                <option key={converter.id} value={converter.id}>
                  {converter.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            onClick={handleConvert}
          >
            Forge
          </motion.button>
        </div>

        {flow.length > 0 && (
          <div className="bg-gray-800 p-2 rounded-lg">
            <div className="flex flex-wrap gap-2 items-center">
              {flow.map((step, index) => (
                <>
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-700 p-2 rounded flex items-center"
                  >
                    <span>{`${step.name}`}</span>
                    <TrashIcon
                      className="ml-2 text-red-400 cursor-pointer hover:text-red-300"
                      onClick={() => removeFromFlow(index)}
                    />
                  </motion.div>

                  {flow[index + 1] && (
                    <MoveRightIcon className="text-gray-400" />
                  )}
                </>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="flex-1 space-y-2">
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-64 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            placeholder="Paste input here"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setInput(e.target.value);
            }}
          />
          {showUtilityButtons && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
              onClick={handlePaste}
            >
              <ClipboardIcon className="inline-block w-5 h-5 mr-2" />
              Paste
            </motion.button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-64 p-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Output will appear here"
            value={output}
            readOnly
          />
          {showUtilityButtons && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
              onClick={handleCopy}
            >
              <CopyIcon className="inline-block w-5 h-5 mr-2" />
              Copy Output
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
