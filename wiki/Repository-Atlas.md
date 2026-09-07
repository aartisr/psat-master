# The Repository Atlas: Under the Hood of PSAT Master 🗺️

Welcome to the technical anatomy of **PSAT Master**. If you are looking to run, inspect, or build the application, jump directly into the live environments:
* 🚀 **[Launch the Live PSAT Master Web App](https://psat-master.vercel.app)**
* 🌟 **[Launch the Live GitHub Pages Mirror](https://aartisr.github.io/psat-master/)**
* 📁 **[Explore our Open Source Repository](https://github.com/aartisr/psat-master)**

---

## 🏛️ Architecture Overview

The system is designed with a **client-first, zero-overhead philosophy**. Standard prep suites rely on heavy backend systems to query questions, record user clicks, and store scoring analytics. This introduces network delays, data privacy concerns, and server costs that eventually force developers to put up paywalls.

**PSAT Master** is completely full-featured yet highly modular and runs entirely in the user's browser, enabling sub-millisecond page transitions and 100% offline support.

```
       +-------------------------------------------------+
       |               User's Browser                    |
       |                                                 |
       |  +-------------------+   +-------------------+  |
       |  |  React Component  |   |   Mistake Engine  |  |
       |  |      View layer   |   |   & Trackers      |  |
       |  +---------+---------+   +---------+---------+  |
       |            |                       |            |
       |            +-----------+-----------+            |
       |                        |                        |
       |                        v                        |
       |             +---------------------+             |
       |             |  Local Storage /    |             |
       |             |  IndexedDB Sandbox  |             |
       |             +---------------------+             |
       +-------------------------------------------------+
```

---

## 🗄️ Anatomical Breakdown of Core Modules

### 1. The Interactive Question Engine (`/src/components/`)
* **Interactive HUD & Testing Frame**: Built to emulate the layout, spacing, and styling of the official Digital SAT Bluebook application. Includes cross-out features, question flagging, and dynamic timers.
* **Smart Drills Component**: Orchestrates rapid adaptive learning loops, picking conceptual questions dynamically based on the student's accuracy.
* 👉 **[Try the Smart Drills Live on the Web App](https://psat-master.vercel.app)**
* 👉 **[Try the Smart Drills Live on GitHub Pages](https://aartisr.github.io/psat-master/)**

### 2. Math Formula & Visualizing Modules
* **Coordinate Graphing Interface**: Supports linear, quadratic, and exponential function plotting in real time.
* **KaTeX Rendering Engine**: Integrates full LaTeX-based mathematical formatting to guarantee that complex proofs and formula banks look beautiful on all screen sizes.
* 👉 **[Explore Math Tools Live on the Web App](https://psat-master.vercel.app)**

### 3. The Local Privacy State Machine
* **IndexedDB & LocalStorage Adapter**: Ensures all exam completions, active question states, flagged bookmarks, and mistake logs are persisted on-device. No data ever leaves the browser, and you can resume right where you left off.

---

## ⚙️ Build and Run Pipeline

To build and examine this clean, local environment yourself:

```bash
# Clone the open source repository
git clone https://github.com/aartisr/psat-master.git

# Install dependencies
npm install

# Run the local development server
npm run dev
```

---

## 🔗 Mutual Discovery Rings

To ensure search engines can index and serve this valuable public study resource to anyone looking for SAT and PSAT preparation, we maintain an intentional network of discoverability paths:
* 🌐 **[Main Web App on Vercel](https://psat-master.vercel.app)**
* 🌟 **[Main Web App on GitHub Pages](https://aartisr.github.io/psat-master/)**
* 📁 **[The GitHub Source Repository](https://github.com/aartisr/psat-master)**
* 👩‍💻 **[Learn More About Aarti's Vision](https://aartisr.github.io/psat-master/author-aarti-s-ravikumar.html)**
* 📰 **[Read our Nobel-Tier Genesis Story](https://aartisr.github.io/psat-master/repo-story.html)**
