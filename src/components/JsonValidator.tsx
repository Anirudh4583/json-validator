import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Upload, FileJson, X } from 'lucide-react';
import { validateJson, ValidationResult } from '../utils/jsonValidator';

const JsonValidator: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setValidationResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  const validateJsonInput = () => {
    if (!jsonInput.trim()) {
      setValidationResult({
        valid: false,
        errors: [{ type: 'EmptyInput', message: 'JSON input is empty' }]
      });
      return;
    }

    const result = validateJson(jsonInput);
    setValidationResult(result);
  };

  const clearInput = () => {
    setJsonInput('');
    setValidationResult(null);
    setFileName('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FileJson className="mr-2" size={28} />
        JSON Validator
      </h1>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700">
            Enter or upload JSON to validate
          </label>
          
          <div className="flex space-x-2">
            <label className="cursor-pointer px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition flex items-center text-sm">
              <Upload size={16} className="mr-1" />
              Upload File
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            
            {jsonInput && (
              <button
                onClick={clearInput}
                className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition flex items-center text-sm"
              >
                <X size={16} className="mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>
        
        {fileName && (
          <div className="mb-2 text-sm text-gray-600 flex items-center">
            <FileJson size={16} className="mr-1" />
            {fileName}
          </div>
        )}
        
        <textarea
          id="json-input"
          value={jsonInput}
          onChange={handleInputChange}
          className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder='{"example": "Paste your JSON here"}'
        />
      </div>
      
      <div className="mb-6">
        <button
          onClick={validateJsonInput}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          disabled={!jsonInput.trim()}
        >
          Validate JSON
        </button>
      </div>
      
      {validationResult && (
        <div className={`p-4 rounded-md ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center mb-2">
            {validationResult.valid ? (
              <>
                <CheckCircle className="text-green-500 mr-2" size={20} />
                <h3 className="text-lg font-medium text-green-800">JSON is valid</h3>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <h3 className="text-lg font-medium text-red-800">JSON validation failed</h3>
              </>
            )}
          </div>
          
          {validationResult.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-red-800 mb-2">Errors found:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="text-red-700">
                    <span className="font-medium">{error.type}:</span> {error.message}
                    {error.path && <span className="block text-sm">Path: {error.path}</span>}
                    {error.line && <span className="block text-sm">Line: {error.line}, Column: {error.column}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonValidator;