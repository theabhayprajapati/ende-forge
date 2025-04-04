"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronDownIcon,
  TrashIcon,
  CopyIcon,
  ClipboardIcon,
  Code2Icon,
  FileCodeIcon,
  GlobeIcon,
  WandIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as beautify from 'js-beautify';
import * as YAML from 'yaml';
import JSON5 from 'json5';
import safeStringify from 'safe-json-stringify';

interface Converter {
  id: string;
  name: string;
  convert: (input: string) => string;
}

interface ParsedJSON {
  parsed: unknown;
  wasString: boolean;
}

const tryParseJSON = (input: string): ParsedJSON | null => {
  try {
    const parsed = JSON.parse(input);
    return { parsed, wasString: false };
  } catch {
    try {
      const parsed = JSON5.parse(input);
      return { parsed, wasString: false };
    } catch {
      try {
        const unescaped = input
          .replace(/\\\\"/g, '\\"')
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
        
        const parsed = JSON.parse(unescaped);
        return { parsed, wasString: true };
      } catch {
        return null;
      }
    }
  }
};

const parseNestedJSON = (input: unknown, depth = 0, maxDepth = 10): unknown => {
  if (depth >= maxDepth) return input;

  if (typeof input === 'string') {
    const result = tryParseJSON(input);
    if (result) {
      return parseNestedJSON(result.parsed, depth + 1, maxDepth);
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => parseNestedJSON(item, depth + 1, maxDepth));
  }

  if (typeof input === 'object' && input !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = parseNestedJSON(value, depth + 1, maxDepth);
    }
    return result;
  }

  return input;
};

const formatJSONString = (obj: unknown, space = 2): string => {
  try {
    return safeStringify(obj as object, null, space);
  } catch {
    try {
      return JSON.stringify(obj, null, space);
    } catch {
      throw new Error('Unable to stringify JSON');
    }
  }
};

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
    {
      id: "json-parse",
      name: "JSON Parse",
      convert: (input: string) => {
        try {
          // Try to parse the input with our robust parser
          const parsed = parseNestedJSON(input);
          if (parsed === null) {
            throw new Error('Invalid JSON: Unable to parse the input');
          }

          // Format the result nicely
          return formatJSONString(parsed);
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Invalid JSON');
        }
      },
    },
  ],
};

const languages = [
  "Plain text",
  "JSON",
  "HTML",
  "XML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "YAML",
  "Markdown",
  "Base64",
  "URL-encoded",
  "CSV",
];

interface ValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Plain text");
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

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

  useEffect(() => {
    if (isAutoDetecting && input) {
      const detected = detectTextFormat(input);
      setSelectedLanguage(detected);
    }
  }, [input, isAutoDetecting]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setIsAutoDetecting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!isAutoDetecting) {
      const detected = detectTextFormat(e.target.value);
      setSelectedLanguage(detected);
    }
  };

  const formatPlainText = (text: string): string => {
    // Remove multiple empty lines
    const singleEmptyLines = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    // Ensure consistent line endings
    const consistentLineEndings = singleEmptyLines.replace(/\r\n/g, '\n');
    // Remove trailing whitespace
    const noTrailingWhitespace = consistentLineEndings.split('\n').map(line => line.trimEnd()).join('\n');
    // Ensure single newline at end of file
    return noTrailingWhitespace.trim() + '\n';
  };

  const formatYAML = (text: string): string => {
    try {
      // Parse YAML to ensure it's valid
      const parsed = YAML.parse(text);
      // Convert back to YAML with consistent formatting
      return YAML.stringify(parsed, {
        indent: 2,
        lineWidth: 80,
      });
    } catch {
      throw new Error('Invalid YAML');
    }
  };

  const formatJSON = (text: string): string => {
    try {
      const parsed = parseNestedJSON(text);
      if (parsed === null) {
        throw new Error('Invalid JSON');
      }
      return formatJSONString(parsed);
    } catch {
      throw new Error('Invalid JSON');
    }
  };

  const formatCode = async () => {
    if (!input) return;

    try {
      let formattedCode = input;
      
      switch (selectedLanguage.toLowerCase()) {
        case 'plain text':
          formattedCode = formatPlainText(input);
          break;

        case 'json':
          formattedCode = formatJSON(input);
          break;

        case 'yaml':
          formattedCode = formatYAML(input);
          break;

        case 'html':
          formattedCode = beautify.html(input, {
            indent_size: 2,
            wrap_line_length: 80,
            preserve_newlines: true,
          });
          break;

        case 'css':
          formattedCode = beautify.css(input, {
            indent_size: 2,
          });
          break;

        case 'javascript':
        case 'typescript':
          formattedCode = beautify.js(input, {
            indent_size: 2,
            preserve_newlines: true,
            space_in_empty_paren: true,
          });
          break;

        case 'xml':
          formattedCode = beautify.html(input, {
            indent_size: 2,
            wrap_line_length: 80,
            preserve_newlines: true,
          });
          break;

        default:
          // For unsupported formats, just clean up the text
          formattedCode = formatPlainText(input);
      }

      setInput(formattedCode);
      setOutput(""); // Clear any previous error messages
    } catch (err) {
      console.error('Formatting error:', err);
      setOutput(`Error formatting ${selectedLanguage}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const validateJSON = (text: string): ValidationResult => {
    try {
      const result = tryParseJSON(text);
      if (!result) {
        return { 
          isValid: false,
          error: 'Invalid JSON format'
        };
      }
      return { isValid: true };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/at position (\d+)/);
        const position = match ? parseInt(match[1]) : 0;
        
        // Calculate line and column
        const lines = text.slice(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        return {
          isValid: false,
          error: error.message.replace(/^JSON\.parse: /, ''),
          line,
          column,
        };
      }
      return { isValid: false, error: 'Invalid JSON' };
    }
  };

  const validateYAML = (text: string): ValidationResult => {
    try {
      YAML.parse(text);
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Invalid YAML format',
      };
    }
  };

  const validatePlainText = (text: string): ValidationResult => {
    // Check for common encoding issues or control characters
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text);
    if (hasControlChars) {
      return {
        isValid: false,
        error: 'Text contains invalid control characters',
      };
    }
    return { isValid: true };
  };

  const validate = () => {
    if (!input) {
      setValidationResult(null);
      return;
    }

    let result: ValidationResult;

    switch (selectedLanguage.toLowerCase()) {
      case 'json':
        result = validateJSON(input);
        break;

      case 'yaml':
        result = validateYAML(input);
        break;

      case 'plain text':
        result = validatePlainText(input);
        break;

      default:
        result = validatePlainText(input);
    }

    setValidationResult(result);
  };

  // Run validation whenever input or language changes
  useEffect(() => {
    validate();
  }, [input, selectedLanguage]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2Icon className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              ENDE Forge
            </h1>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex space-x-4 items-center">
            <button
              onClick={toggleMode}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                mode === "encode"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              )}
            >
              {mode === "encode" ? "Encode" : "Decode"}
            </button>
            <div className="relative flex-grow">
              <select
                className="w-full h-10 pl-3 pr-10 bg-secondary/50 text-secondary-foreground rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 cursor-pointer hover:bg-secondary/80"
                onChange={(e) => addToFlow(e.target.value)}
                value=""
              >
                <option value="" className="bg-secondary text-secondary-foreground">
                  Select a {mode} converter
                </option>
                {converters[mode].map((converter) => (
                  <option 
                    key={converter.id} 
                    value={converter.id}
                    className="bg-secondary text-secondary-foreground py-2"
                  >
                    {converter.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200"
              onClick={handleConvert}
            >
              Forge
            </motion.button>
          </div>

          {flow.length > 0 && (
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-2 items-center">
                {flow.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary p-2 rounded-lg flex items-center space-x-2"
                  >
                    <FileCodeIcon className="h-4 w-4 text-blue-500" />
                    <span>{step.name}</span>
                    <button
                      onClick={() => removeFromFlow(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2 min-h-[300px] h-[calc(100vh-24rem)] max-h-[800px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground/90">Input</label>
                  {validationResult && (
                    <div className="flex items-center space-x-1">
                      {validationResult.isValid ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircleIcon className="h-4 w-4 text-red-500" />
                      )}
                      {!validationResult.isValid && (
                        <span className="text-xs text-red-500">
                          {validationResult.error}
                          {validationResult.line && ` (Line ${validationResult.line}${validationResult.column ? `, Column ${validationResult.column}` : ''})`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={handleLanguageChange}
                      className="h-8 pl-3 pr-8 bg-secondary/50 text-secondary-foreground rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 cursor-pointer hover:bg-secondary/80 text-sm"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang} className="bg-secondary text-secondary-foreground">
                          {lang}
                        </option>
                      ))}
                    </select>
                    <GlobeIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <button
                    onClick={formatCode}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-secondary/60"
                    title="Format code"
                  >
                    <WandIcon className="h-4 w-4" />
                    <span>Format</span>
                  </button>
                  <button
                    onClick={handlePaste}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-secondary/60"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                    <span>Paste</span>
                  </button>
                </div>
              </div>
              <div className={cn(
                "relative flex-grow h-full",
                validationResult?.isValid === false && "ring-2 ring-red-500/20"
              )}>
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  className={cn(
                    "absolute inset-0 w-full h-full p-4 bg-secondary/50 text-secondary-foreground rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-y font-mono",
                    validationResult?.isValid === false && "focus:ring-red-500/50"
                  )}
                  placeholder="Enter text to convert..."
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2 min-h-[300px] h-[calc(100vh-24rem)] max-h-[800px]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground/90">Output</label>
                <button
                  onClick={handleCopy}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-secondary/60"
                >
                  <CopyIcon className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="relative flex-grow h-full">
                <textarea
                  value={output}
                  readOnly
                  className="absolute inset-0 w-full h-full p-4 bg-secondary/50 text-secondary-foreground rounded-lg font-mono border border-border/5"
                  placeholder="Converted text will appear here..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
