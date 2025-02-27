import React from "react";
import JsonValidator from "./components/JsonValidator";
import { Heart } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            JSON Validator Tool
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Validate your JSON files to detect anomalies before parsing
          </p>
        </div>

        <JsonValidator />

        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            About This Tool
          </h2>
          <p className="text-gray-600 mb-4">
            This JSON validator helps detect common issues that might cause
            problems when parsing JSON:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Syntax errors (missing commas, brackets, etc.)</li>
            <li>Duplicate keys in objects (which can lead to data loss)</li>
            <li>Circular references that can't be serialized</li>
            <li>Invalid number values (NaN, Infinity)</li>
            <li>Excessive nesting depth</li>
            <li>Extremely large arrays or objects</li>
            <li>Schema validation (when a schema is provided)</li>
          </ul>
        </div>
      </div>
      <footer className="w-full py-4 text-center text-sm text-gray-600">
        <div className="flex items-center justify-center gap-1">
          Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by
          Anirudh
        </div>
      </footer>
    </div>
  );
}

export default App;
