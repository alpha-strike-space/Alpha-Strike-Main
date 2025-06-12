## About Alpha-Strike Killboard

Alpha-Strike Killboard [https://www.alpha-strike.space/](https://www.alpha-strike.space/) is designed to provide players of Eve Frontier with a comprehensive overview of PvP (Player versus Player) activities. It tracks and displays information such as:

- Recent killmails ("Recently Stamped")
- Leading killers
- Leading victims
- Most active systems
- Search functionality for names or systems
- Detailed killmail views

The interface supports multiple languages, including English, Spanish, Russian, and Chinese.

---

## Folder Structure

The project is organized as follows:

```
alpha-strike-main/                  # Git version control directory
├── .husky/                  # Git hooks for pre-commit and pre-push operations                 # Trunk.io configuration directory
├── public/                  # Static assets (favicon, images, localization files)
│   ├── assets/
│   │   └── images/
│   └── localization/
│       └── translations.json # Language translation strings
├── components/              # Reusable UI components (e.g., navigation)
│   └── navigation.js
├── js/                      # Core JavaScript logic
│   ├── api.js               # API fetch functions
│   ├── common.js            # Common initialization and utility functions for pages
│   ├── monthly-tables.js    # Logic for displaying monthly statistics tables
│   ├── translation-dictionary.js # Handles language switching and translations
│   ├── utils.js             # Utility functions (e.g., timestamp formatting, navigation)
│   ├── websocket.js         # WebSocket manager for live updates
│   └── types/               # JSDoc type definitions for API responses
├── pages/                   # HTML files for different sections of the site
│   ├── killers.html
│   ├── killmail.html
│   ├── search.html
│   ├── systems.html
│   └── victims.html
├── styles/                  # CSS stylesheets
│   ├── main.css             # Main stylesheet importing all others
│   ├── base.css
│   ├── animations.css
│   ├── utilities.css
│   ├── variables.css
│   └── components/          # Component-specific styles
├── dist/                    # Production build output directory
├── node_modules/            # Project dependencies installed by npm/yarn
├── index.html               # Main entry point of the application
├── package.json             # Project metadata and dependencies
├── package-lock.json        # Exact versions of dependencies
├── vite.config.js           # Vite configuration file
├── biome.json              # Biome linter and formatter configuration
├── .gitignore              # Git ignore rules
├── LICENSE                 # Project license file
└── README.md                # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: (LTS version recommended)
- **npm** (Node Package Manager) or **yarn**

---

## Getting Started

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd alpha-strike-main
    ```

---

## Installation

1.  **Install project dependencies**:
    Open your terminal in the project's root directory and run:
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```
    This will install Vite and other necessary development dependencies listed in `package.json`.

---

## Running Locally (Development)

1.  **Start the development server**:
    To run the project locally with Vite's development server, which includes features like Hot Module Replacement (HMR), execute:
    ```bash
    npm run dev
    ```
    or with yarn:
    ```bash
    yarn dev
    ```
    This command is defined in the `scripts` section of your `package.json`.
2.  Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173` or similar).

---

## Building for Production

1.  **Build the project**:
    To create an optimized build for production, run:
    ```bash
    npm run build
    ```
    or with yarn:
    ```bash
    yarn build
    ```
    This command, also found in `package.json`, will use Vite to bundle your HTML, CSS, and JavaScript files. The output will be placed in a `dist/` directory by default. The `vite.config.js` file specifies the input HTML files for the build process.

---

## Previewing Production Build

1.  **Preview the production build locally**:
    After building the project, you can preview the production version by running:
    ```bash
    npm run preview
    ```
    or with yarn:
    ```bash
    yarn preview
    ```
    This command starts a local static web server that serves the files from your `dist/` directory.

---

## How to Contribute

You may create a pull request to make any changes that you feel are necessary to improve the leaderboard. Please test your changes locally on your machine before submitting. Pull requests will be reviewed and either rejected or merged, after which they will be updated on the website.

---

## Credits

- The black hole image used in the website's cascading style sheets was sourced from an article by Jean-Pierre Luminet, referenced at [https://www.engadget.com/2017-04-19-black-hole-image-jean-pierre-luminet.html](https://www.engadget.com/2017-04-19-black-hole-image-jean-pierre-luminet.html).
- The favicon images were generated using the favicon generator hosted by [https://icons8.com/icons](https://icons8.com/icons).
