# IndexNow Search Engine Discovery Pipeline 🛰️

Welcome to our automated search index pipeline. In order to make sure that students, parents, and educators worldwide can find our free, zero-friction study materials directly from search result pages without paying marketing fees, we leverage the **IndexNow protocol**.

* 🚀 **[Launch the Live PSAT Master Web App](https://psat-master.vercel.app)**
* 🌟 **[Launch the Live GitHub Pages Mirror](https://aartisr.github.io/psat-master/)**
* 📁 **[Explore our Open Source Repository](https://github.com/aartisr/psat-master)**

---

## 📡 What is IndexNow?

**IndexNow** is a modern search engine discovery protocol. Rather than waiting weeks or months for crawlers (like Bingbot or YandexBot) to discover our newly generated mathematical formulas, study guides, and question banks, IndexNow allows the platform to proactively **ping** search engines the second a new guide or module is published. This means:
* **Immediate Indexing**: Search engines receive the exact, real-time list of all our resources, articles, and question paths.
* **Energy Efficiency**: Reduces server, client, and search engine crawler overhead by notifying engines only when updates actually occur.
* **Open Discoverability**: Establishes **PSAT Master** as a fast, high-credibility learning hub in search algorithms.

---

## 🛠️ Setup and Execution Flow

The verification and ping mechanism is fully integrated into the codebase. To configure and execute this discovery cycle:

### 1. Key Verification Placement
Search engines must confirm that you own the domain you are claiming to index. A verification text file containing a unique key must be hosted at:
`https://aartisr.github.io/psat-master/indexnow-key.txt`

Because our GitHub Pages environment serves files directly from the `/docs/` folder of the `main` branch, our script writes this verification key directly inside `/docs/indexnow-key.txt`.

### 2. Publish and Verification Steps
Run the script below to dynamically configure your key:

```bash
# Generate and write your verification key
INDEXNOW_KEY=your-unique-verification-key npm run indexnow:publish-key

# Submit the complete site index map to search engines
INDEXNOW_KEY=your-unique-verification-key npm run indexnow
```

---

## 🔗 Discoverability Rings

To maintain a robust signal across search engines and help students find our platform completely free, we cross-link our main nodes consistently:
* 🌐 **[Main Web App on Vercel](https://psat-master.vercel.app)**
* 🌟 **[Main Web App on GitHub Pages](https://aartisr.github.io/psat-master/)**
* 📁 **[The GitHub Source Repository](https://github.com/aartisr/psat-master)**
* 👩‍💻 **[Meet Aarti S. Ravikumar](https://aartisr.github.io/psat-master/author-aarti-s-ravikumar.html)**
* 📰 **[Read our Nobel-Tier Genesis Story](https://aartisr.github.io/psat-master/repo-story.html)**
