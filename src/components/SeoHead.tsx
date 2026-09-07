import { useEffect } from 'react';
import type { MainNavTab } from './Header';

interface SeoHeadProps {
  activeTab: MainNavTab;
  canonicalPath: string;
}

const SITE_NAME = 'PSAT Master';
const BASE_DESCRIPTION = 'PSAT Master is a fast, local-first Digital PSAT/NMSQT and SAT prep platform with a 2,900-question bank, adaptive smart drills, analytics, mistake tracking, cheat sheets, calculator tools, and AI-assisted study support.';

const TAB_METADATA: Record<MainNavTab, { title: string; description: string; keywords: string[] }> = {
  bank: {
    title: 'PSAT Master | Digital PSAT/NMSQT Question Bank',
    description: BASE_DESCRIPTION,
    keywords: ['PSAT question bank', 'Digital PSAT practice', 'SAT question bank', 'search PSAT questions', 'adaptive practice']
  },
  practice_tests: {
    title: 'PSAT Master | Official Full-Length Practice Exams & Bluebook Simulator',
    description: 'Experience authentic College Board Digital PSAT/NMSQT and SAT full-length practice tests with 2-stage adaptive routing, Desmos calculator, and scaled score diagnostic reports.',
    keywords: ['PSAT practice test', 'official PSAT test', 'Bluebook simulator', 'SAT practice test', 'adaptive exam', 'NMSC selection index']
  },
  smart_drills: {
    title: 'PSAT Master | Adaptive Smart Drills',
    description: 'Launch adaptive PSAT and SAT drills, target weak skills, and review missed questions with a focused practice flow.',
    keywords: ['adaptive drills', 'weakness drills', 'missed questions', 'timed practice', 'skill drills']
  },
  mistakes: {
    title: 'PSAT Master | Mistake Notebook and Error Review',
    description: 'Track mistakes, review why answers were wrong, and turn every missed PSAT or SAT question into a structured study loop.',
    keywords: ['mistake notebook', 'error review', 'missed question tracking', 'PSAT mistakes', 'SAT mistakes']
  },
  cheats: {
    title: 'PSAT Master | Concept Cheat Sheets',
    description: 'Use fast-reference math and reading cheat sheets, formulas, and concept summaries to study with less friction.',
    keywords: ['math formulas', 'cheat sheets', 'concept review', 'PSAT math help', 'reading rules']
  },
  analytics: {
    title: 'PSAT Master | Score Analytics and Mastery Dashboard',
    description: 'See performance trends, accuracy, streaks, mastery gaps, and progress signals in one focused analytics view.',
    keywords: ['score analytics', 'mastery dashboard', 'progress tracking', 'study analytics', 'performance trends']
  },
  rank: {
    title: 'PSAT Master | Student Rank & Leaderboard',
    description: 'Official student rankings, percentile benchmarking, XP tier roadmaps, and verified badge milestones for PSAT/NMSQT & SAT prep.',
    keywords: ['student rank', 'PSAT leaderboard', 'percentile standing', 'XP level', 'achievement badges', 'study streaks']
  },
  drill: {
    title: 'PSAT Master | Focused Drill Runner',
    description: 'Run a focused drill session with question-by-question support, scratchpad tools, calculator access, and bookmark review.',
    keywords: ['drill runner', 'focused practice', 'PSAT drill', 'SAT drill', 'question session']
  },
  admin: {
    title: 'PSAT Master | Admin Repository',
    description: 'Manage the PSAT Master question repository, upload content, and audit study materials from the admin command center.',
    keywords: ['question repository', 'admin portal', 'content management', 'question upload', 'content audit']
  },
  feedback: {
    title: 'PSAT Master | Feedback, Bugs, and Feature Requests',
    description: 'Share bug reports, question issues, and feature requests to improve the PSAT Master study experience.',
    keywords: ['feedback hub', 'bug report', 'feature request', 'support', 'question issue']
  }
};

const FAQ_DATA = [
  {
    question: 'What is PSAT Master?',
    answer: 'PSAT Master is a local-first Digital PSAT/NMSQT and SAT prep platform with a searchable question bank, adaptive drills, mistake tracking, analytics, and study tools.'
  },
  {
    question: 'Does PSAT Master support quick review?',
    answer: 'Yes. The app includes a mistake notebook, concept cheat sheets, bookmarks, calculator access, scratchpad support, and AI-assisted explanations.'
  },
  {
    question: 'Is PSAT Master usable offline?',
    answer: 'The app is designed for local-first practice and can continue to function when cloud storage is unavailable or quota-limited.'
  }
];

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function SeoHead({ activeTab, canonicalPath }: SeoHeadProps) {
  const metadata = TAB_METADATA[activeTab] ?? TAB_METADATA.bank;

  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = new URL(canonicalPath || '/', origin).toString();
    const title = metadata.title;
    const description = metadata.description;
    const keywords = Array.from(new Set([
      ...metadata.keywords,
      'PSAT Master',
      'Digital PSAT/NMSQT',
      'SAT prep',
      'adaptive learning',
      'question bank',
      'study platform'
    ])).join(', ');

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    upsertMeta('name', 'googlebot', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    upsertMeta('name', 'application-name', SITE_NAME);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', `${origin}/og-image.svg`);
    upsertMeta('property', 'og:image:type', 'image/svg+xml');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', `${origin}/og-image.svg`);
    upsertMeta('name', 'theme-color', '#2563eb');
    upsertLink('canonical', canonicalUrl);

    const jsonLdId = 'psat-master-seo-jsonld';
    let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = jsonLdId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: SITE_NAME,
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            url: canonicalUrl,
            description,
            image: `${origin}/og-image.svg`,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            featureList: [
              'Digital PSAT/NMSQT and SAT question bank',
              'Adaptive smart drills',
              'Mistake notebook',
              'Analytics dashboard',
              'Calculator and scratchpad tools'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
          }
        ]
      },
      null,
      0
    );
  }, [activeTab, canonicalPath, metadata.description, metadata.keywords, metadata.title]);

  return null;
}
