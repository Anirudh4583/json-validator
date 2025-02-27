# JSON Validator

This project is a simple JSON validator built with React and TypeScript. It allows users to input JSON data and validates it.

## Project Structure

- `.gitignore`: Specifies intentionally untracked files that Git should ignore.
- `eslint.config.js`: Configuration file for ESLint, a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
- `index.html`: The main HTML file for the application.
- `package.json`: Contains metadata about the project, including dependencies and scripts.
- `pnpm-lock.yaml`: Lockfile for pnpm, ensuring consistent installations across different environments.
- `postcss.config.js`: Configuration file for PostCSS, a tool for transforming CSS with JavaScript.
- `tailwind.config.js`: Configuration file for Tailwind CSS, a utility-first CSS framework.
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`: Configuration files for the TypeScript compiler.
- `vite.config.ts`: Configuration file for Vite, a build tool and development server.
- `src/`: Contains the source code for the application.
  - `src/App.tsx`: The main application component.
  - `src/index.css`: Global CSS file.
  - `src/main.tsx`: Entry point for the React application.
  - `src/vite-env.d.ts`: TypeScript declaration file for Vite environment variables.
  - `src/components/`: Contains React components.
    - `src/components/JsonValidator.tsx`: The JSON validator component.
  - `src/utils/`: Contains utility functions.
    - `src/utils/jsonValidator.ts`: Logic for JSON validation.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone [repository URL]
    ```

2.  **Install dependencies:**

    ```bash
        pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm run dev
    ```

This will start the development server and open the application in your default browser.

## Usage

Enter your JSON in the text area and the app will validate and show you the result.
