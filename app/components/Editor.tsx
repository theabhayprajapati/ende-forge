"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon, TrashIcon, PlusIcon } from 'lucide-react';
import UIButton from './UIButton';

const converters = [
  { id: 'base64', name: 'Base64 Encode', convert: (input: string) => btoa(input) },
  { id: 'uri', name: 'URI Encode', convert: (input: string) => encodeURIComponent(input) },
  { id: 'json', name: 'JSON Stringify', convert: (input: string) => JSON.stringify(input) },
  { id: 'base64-decode', name: 'Base64 Decode', convert: (input: string) => atob(input) },
  { id: 'uri-decode', name: 'URI Decode', convert: (input: string) => decodeURIComponent(input) },
  { id: 'json-parse', name: 'JSON Parse', convert: (input: string) => JSON.parse(input) },
];

export default function NebulaForge() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [flow, setFlow] = useState<any>([]);
  
  const addToFlow = (converterId: string) => {
    if (!converterId) return;
    const converter = converters.find(c => c.id === converterId);
    setFlow([...flow, converter]);
  };

  const removeFromFlow = (index: number) => {
    setFlow(flow.filter((_, i) => i !== index));
  };

  const clearFlow = () => {
    setFlow([]);
  };

  const saveFlow = () => {
    console.log('Flow saved:', flow);
    alert('Flow saved successfully!');
  };

  const handleConvert = () => {
    try {
      let result = input;
      flow.forEach((step) => {
        result = step.convert(result);
      });
      setOutput(result);
    } catch (error) {
      console.error(error);
      setOutput('Error: Invalid conversion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] to-[#000000] text-white">
      <header className="bg-[#000000] p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-center text-[#00FFFF]">Nebula Forge</h1>
      </header>

      <main className="container mx-auto p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-6">
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-48 p-4 bg-[#1E2333] border border-[#2A2F42] rounded-lg focus:ring-2 focus:ring-[#00FFFF] focus:border-transparent text-lg"
            placeholder="Enter your input here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
<UIButton color="bg-cyan-600 hover:bg-cyan-700" onClick={handleConvert} className='w-full'>
            Convert
          </UIButton>
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-48 p-4 bg-[#1E2333] border border-[#2A2F42] rounded-lg text-lg"
            placeholder="Output will appear here"
            value={output}
            readOnly
          />
        </div>

        <div className="lg:w-1/3 bg-[#1E2333] p-6 rounded-lg shadow-xl space-y-6">
          <h2 className="text-2xl font-semibold mb-4 text-[#00FFFF]">Flow Builder</h2>
          <div className="relative">
            <select
              className="w-full p-3 bg-[#2A2F42] rounded-lg appearance-none focus:ring-2 focus:ring-[#00FFFF] focus:border-transparent text-lg"
              onChange={(e) => addToFlow(e.target.value)}
              value=""
            >
              <option value="">Select a converter</option>
              {converters.map((converter) => (
                <option key={converter.id} value={converter.id}>
                  {converter.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00FFFF]" />
          </div>

          <div className="space-y-3">
            {flow.length === 0 ? (
              <p className="text-gray-400 text-center">No converters in flow yet.</p>
            ) : (
              flow.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#2A2F42] p-3 rounded-lg flex justify-between items-center"
                >
                  <span>{step.name}</span>
                  <TrashIcon
                    className="text-red-400 cursor-pointer hover:text-red-300 transition-colors duration-200"
                    onClick={() => removeFromFlow(index)}
                  />
                </motion.div>
              ))
            )}
          </div>

          <div className="flex space-x-4">
          <UIButton color="bg-red-600 hover:bg-red-700" onClick={clearFlow}>
              Clear Flow
            </UIButton>
            <UIButton color="bg-green-600 hover:bg-green-700" onClick={saveFlow}>
              Save Flow
            </UIButton>
          </div>
        </div>
      </main>
    </div>
  );
}