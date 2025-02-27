/**
 * JSON Validator Utility
 * 
 * This utility provides functions to validate JSON data and detect anomalies
 * that might cause issues when parsing or processing the JSON in other applications.
 */

import Ajv from 'ajv';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  type: string;
  message: string;
  path?: string;
  line?: number;
  column?: number;
}

/**
 * Validates a JSON string for syntax errors
 * @param jsonString The JSON string to validate
 * @returns A validation result object
 */
export function validateJsonSyntax(jsonString: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: []
  };

  try {
    JSON.parse(jsonString);
  } catch (error) {
    result.valid = false;
    
    if (error instanceof SyntaxError) {
      // Extract line and column information if available
      const match = error.message.match(/at position (\d+)/);
      const position = match ? parseInt(match[1], 10) : null;
      
      // Calculate line and column from position
      let line = 1;
      let column = 1;
      
      if (position !== null) {
        for (let i = 0; i < position; i++) {
          if (jsonString[i] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }
      }
      
      result.errors.push({
        type: 'SyntaxError',
        message: error.message,
        line,
        column
      });
    } else {
      result.errors.push({
        type: 'UnknownError',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return result;
}

/**
 * Validates JSON data against a schema
 * @param jsonData The parsed JSON data to validate
 * @param schema The JSON schema to validate against
 * @returns A validation result object
 */
export function validateJsonSchema(jsonData: any, schema: object): ValidationResult {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(jsonData);
  
  const result: ValidationResult = {
    valid: !!valid,
    errors: []
  };

  if (!valid && validate.errors) {
    result.errors = validate.errors.map(err => ({
      type: 'SchemaError',
      message: err.message || 'Unknown schema validation error',
      path: err.instancePath
    }));
  }

  return result;
}

/**
 * Checks for duplicate keys in JSON objects
 * @param jsonString The JSON string to check
 * @returns A validation result object
 */
export function checkDuplicateKeys(jsonString: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: []
  };

  // Simple but effective approach to detect duplicate keys
  const lines = jsonString.split('\n');
  const duplicates: {key: string, line: number, column: number}[] = [];
  
  // Regular expression to find keys in JSON
  const keyRegex = /"([^"]+)"\s*:/g;
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const keys = new Map<string, number[]>();
    
    let match;
    while ((match = keyRegex.exec(line)) !== null) {
      const key = match[1];
      const column = match.index + 1;
      
      if (!keys.has(key)) {
        keys.set(key, [column]);
      } else {
        keys.get(key)!.push(column);
      }
    }
    
    // Check for duplicates in this line
    for (const [key, positions] of keys.entries()) {
      if (positions.length > 1) {
        // Found duplicates
        for (let i = 1; i < positions.length; i++) {
          duplicates.push({
            key,
            line: lineNum + 1,
            column: positions[i]
          });
        }
      }
    }
  }
  
  // More thorough check for duplicate keys across the entire JSON
  try {
    // This is a more reliable approach that will catch duplicate keys
    // even if they're not on the same line
    const strictJSON = JSON.stringify(JSON.parse(jsonString));
    const lenientJSON = JSON.stringify(JSON.parse(jsonString, (k, v) => v));
    
    // If the lengths are different, it means keys were overwritten
    if (strictJSON.length !== lenientJSON.length) {
      // We need to find which keys were duplicated
      const parsed = JSON.parse(jsonString);
      const keyPaths: string[] = [];
      
      // Function to collect all key paths
      const collectKeys = (obj: any, path: string = '') => {
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              collectKeys(item, path ? `${path}[${index}]` : `[${index}]`);
            });
          } else {
            for (const key in obj) {
              const newPath = path ? `${path}.${key}` : key;
              keyPaths.push(newPath);
              collectKeys(obj[key], newPath);
            }
          }
        }
      };
      
      collectKeys(parsed);
      
      // Now parse again with a custom reviver to detect duplicates
      const seenKeys = new Set<string>();
      const duplicateKeyPaths: string[] = [];
      
      const detectDuplicates = (obj: any, path: string = '') => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          const keys = Object.keys(obj);
          const keySet = new Set<string>();
          
          for (const key of keys) {
            if (keySet.has(key)) {
              duplicateKeyPaths.push(path ? `${path}.${key}` : key);
            }
            keySet.add(key);
            
            const newPath = path ? `${path}.${key}` : key;
            detectDuplicates(obj[key], newPath);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            detectDuplicates(item, path ? `${path}[${index}]` : `[${index}]`);
          });
        }
      };
      
      detectDuplicates(parsed);
      
      // If we found duplicate key paths, add them to the errors
      if (duplicateKeyPaths.length > 0) {
        result.valid = false;
        for (const path of duplicateKeyPaths) {
          const key = path.split('.').pop() || path;
          result.errors.push({
            type: 'DuplicateKey',
            message: `Duplicate key "${key}" found in object at path: ${path}`,
            path
          });
        }
      }
    }
  } catch (error) {
    // If there's an error in our duplicate key detection, fall back to syntax validation
    // This ensures we don't miss syntax errors
    const syntaxResult = validateJsonSyntax(jsonString);
    if (!syntaxResult.valid) {
      return syntaxResult;
    }
  }
  
  // Add any line-specific duplicates we found
  if (duplicates.length > 0) {
    result.valid = false;
    for (const dup of duplicates) {
      result.errors.push({
        type: 'DuplicateKey',
        message: `Duplicate key "${dup.key}" found in object`,
        line: dup.line,
        column: dup.column
      });
    }
  }
  
  // Final check: Use a specialized parser that preserves duplicate keys
  try {
    const input = jsonString;
    let at = 0;
    let ch = ' ';
    
    const error = (m: string): never => {
      throw new SyntaxError(m);
    };
    
    const next = (): string => {
      ch = input.charAt(at);
      at += 1;
      return ch;
    };
    
    const white = (): void => {
      while (ch && ch <= ' ') {
        next();
      }
    };
    
    const string = (): string => {
      let str = '';
      if (ch === '"') {
        while (next() !== '"') {
          if (ch === '\\') {
            next();
          }
          str += ch;
        }
        next();
      }
      return str;
    };
    
    const object = (): void => {
      const keys = new Set<string>();
      
      if (ch === '{') {
        next();
        white();
        if (ch === '}') {
          next();
          return;
        }
        while (ch) {
          white();
          if (ch !== '"') {
            break;
          }
          
          const key = string();
          white();
          
          if (ch !== ':') {
            break;
          }
          
          next();
          
          // Check for duplicate key
          if (keys.has(key)) {
            // Find line and column
            let line = 1;
            let column = 1;
            let pos = at - key.length - 3; // Approximate position
            
            for (let i = 0; i < pos; i++) {
              if (input[i] === '\n') {
                line++;
                column = 1;
              } else {
                column++;
              }
            }
            
            result.valid = false;
            result.errors.push({
              type: 'DuplicateKey',
              message: `Duplicate key "${key}" found in object`,
              line,
              column
            });
          }
          
          keys.add(key);
          
          // Skip value
          value();
          white();
          
          if (ch === '}') {
            next();
            return;
          }
          
          if (ch !== ',') {
            break;
          }
          
          next();
        }
        
        error("Bad object");
      }
    };
    
    const array = (): void => {
      if (ch === '[') {
        next();
        white();
        if (ch === ']') {
          next();
          return;
        }
        while (ch) {
          value();
          white();
          if (ch === ']') {
            next();
            return;
          }
          if (ch !== ',') {
            break;
          }
          next();
          white();
        }
      }
      error("Bad array");
    };
    
    const value = (): void => {
      white();
      switch (ch) {
        case '{':
          object();
          return;
        case '[':
          array();
          return;
        case '"':
          string();
          return;
        case '-':
          next();
          // Fall through to handle number
        default:
          // Handle numbers, true, false, null
          while (ch && ch > ' ' && ch !== ',' && ch !== ']' && ch !== '}') {
            next();
          }
      }
    };
    
    // Start parsing
    white();
    value();
    white();
    
    if (ch) {
      error("Syntax error");
    }
    
  } catch (e) {
    // If it's not a syntax error we detected, it might be a real syntax error
    if (e instanceof SyntaxError && !e.message.startsWith("Syntax error")) {
      const syntaxResult = validateJsonSyntax(jsonString);
      if (!syntaxResult.valid) {
        return syntaxResult;
      }
    }
  }

  return result;
}

/**
 * Checks for common JSON issues that might cause problems
 * @param jsonData The parsed JSON data to check
 * @returns A validation result object
 */
export function checkJsonAnomalies(jsonData: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: []
  };

  // Check for circular references
  try {
    JSON.stringify(jsonData);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      result.valid = false;
      result.errors.push({
        type: 'CircularReference',
        message: 'Circular reference detected in JSON data'
      });
    }
  }

  // Check for NaN, Infinity, -Infinity values (which are not valid JSON)
  const checkForInvalidNumbers = (obj: any, path = ''): void => {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'number') {
      if (!Number.isFinite(obj)) {
        result.valid = false;
        result.errors.push({
          type: 'InvalidNumber',
          message: `Invalid number value: ${obj}`,
          path
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForInvalidNumbers(item, `${path}[${index}]`);
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        checkForInvalidNumbers(value, path ? `${path}.${key}` : key);
      });
    }
  };

  checkForInvalidNumbers(jsonData);

  // Check for extremely deep nesting
  const MAX_DEPTH = 100;
  const checkDepth = (obj: any, currentDepth = 0): number => {
    if (currentDepth > MAX_DEPTH) {
      result.valid = false;
      result.errors.push({
        type: 'ExcessiveNesting',
        message: `JSON exceeds maximum recommended nesting depth of ${MAX_DEPTH}`
      });
      return currentDepth;
    }

    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const depth = checkDepth(item, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const depth = checkDepth(obj[key], currentDepth + 1);
          maxDepth = Math.max(maxDepth, depth);
        }
      }
    }

    return maxDepth;
  };

  checkDepth(jsonData);

  // Check for extremely large arrays or objects
  const MAX_COLLECTION_SIZE = 100000;
  const checkSize = (obj: any, path = ''): void => {
    if (Array.isArray(obj) && obj.length > MAX_COLLECTION_SIZE) {
      result.valid = false;
      result.errors.push({
        type: 'LargeArray',
        message: `Array at ${path || 'root'} contains ${obj.length} items, which exceeds the recommended limit of ${MAX_COLLECTION_SIZE}`,
        path
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length > MAX_COLLECTION_SIZE) {
        result.valid = false;
        result.errors.push({
          type: 'LargeObject',
          message: `Object at ${path || 'root'} contains ${keys.length} properties, which exceeds the recommended limit of ${MAX_COLLECTION_SIZE}`,
          path
        });
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkSize(item, `${path}[${index}]`);
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          checkSize(value, path ? `${path}.${key}` : key);
        });
      }
    }
  };

  checkSize(jsonData);

  return result;
}

/**
 * Comprehensive JSON validation function that combines all checks
 * @param jsonString The JSON string to validate
 * @param schema Optional JSON schema to validate against
 * @returns A validation result object
 */
export function validateJson(jsonString: string, schema?: object): ValidationResult {
  // First check for duplicate keys
  const duplicateKeysResult = checkDuplicateKeys(jsonString);
  if (!duplicateKeysResult.valid) {
    return duplicateKeysResult;
  }
  
  // Then check syntax
  const syntaxResult = validateJsonSyntax(jsonString);
  if (!syntaxResult.valid) {
    return syntaxResult;
  }

  // If syntax is valid, parse the JSON
  const jsonData = JSON.parse(jsonString);
  
  // Check for anomalies
  const anomalyResult = checkJsonAnomalies(jsonData);
  
  // If schema is provided, validate against it
  if (schema) {
    const schemaResult = validateJsonSchema(jsonData, schema);
    
    return {
      valid: anomalyResult.valid && schemaResult.valid,
      errors: [...anomalyResult.errors, ...schemaResult.errors]
    };
  }
  
  return anomalyResult;
}