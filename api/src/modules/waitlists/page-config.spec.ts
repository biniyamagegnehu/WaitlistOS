import { BadRequestException } from '@nestjs/common';
import { defaultPageConfig, validatePageConfig, PageConfig, PageSection } from './page-config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<PageConfig> = {}): PageConfig {
  return { ...defaultPageConfig(), ...overrides };
}

function withSection(type: PageSection['type'], content: Record<string, unknown>): PageConfig {
  const config = defaultPageConfig();
  const section = config.sections.find((s) => s.type === type);
  if (!section) throw new Error(`No default ${type} section`);
  section.content = content;
  return config;
}

function withAllRequired(): PageConfig {
  const config = defaultPageConfig();
  for (const section of config.sections) {
    switch (section.type) {
      case 'HERO':
        section.content = { headline: 'Welcome', subheadline: '', description: '' };
        break;
      case 'FEATURES':
        section.content = { title: 'Features', items: JSON.stringify([{ title: 'Fast', description: 'Very fast indeed.' }]) };
        break;
      case 'FAQ':
        section.content = { title: 'FAQ', items: JSON.stringify([{ question: 'What is this?', answer: 'A great product.' }]) };
        break;
      case 'SIGNUP':
        section.content = { title: 'Join the waitlist', subtitle: '' };
        break;
      case 'SOCIAL_PROOF':
        section.content = { title: 'Loved by early adopters', description: '', screenshotUrl: 'https://example.com/screenshot.png' };
        break;
      case 'FOOTER':
        section.content = { title: 'Footer', text: 'All rights reserved.' };
        break;
    }
  }
  return config;
}

// ─── Structural / security ────────────────────────────────────────────────────

describe('structural and security validation', () => {
  it('rejects null / non-object', () => {
    expect(() => validatePageConfig(null)).toThrow(BadRequestException);
    expect(() => validatePageConfig([])).toThrow(BadRequestException);
    expect(() => validatePageConfig('string')).toThrow(BadRequestException);
  });

  it('rejects wrong version', () => {
    const bad = withAllRequired() as any;
    bad.version = 2;
    expect(() => validatePageConfig(bad)).toThrow(BadRequestException);
  });

  it('rejects executable script injection in content', () => {
    const config = withAllRequired() as any;
    config.sections[0].content.headline = '<script>alert(1)</script>';
    expect(() => validatePageConfig(config)).toThrow(BadRequestException);
  });

  it('rejects javascript: URL injection', () => {
    const config = withAllRequired() as any;
    config.sections[0].content.headline = 'javascript:alert(1)';
    expect(() => validatePageConfig(config)).toThrow(BadRequestException);
  });

  it('rejects arbitrary unknown section types', () => {
    const config = withAllRequired() as any;
    config.sections[0].type = 'HTML';
    expect(() => validatePageConfig(config)).toThrow(BadRequestException);
  });

  it('requires a SIGNUP section', () => {
    const config = withAllRequired();
    config.sections = config.sections.filter((s) => s.type !== 'SIGNUP');
    expect(() => validatePageConfig(config)).toThrow(BadRequestException);
  });

  it('prevents duplicate singleton sections', () => {
    const config = withAllRequired() as any;
    const hero = config.sections.find((s: any) => s.type === 'HERO');
    config.sections.push({ ...hero, id: 'hero-2', order: 99 });
    expect(() => validatePageConfig(config)).toThrow(BadRequestException);
  });

  it('accepts valid marketing text without false positives', () => {
    const config = withAllRequired();
    const hero = config.sections.find((s) => s.type === 'HERO')!;
    hero.content = {
      headline: "Build your future 🚀",
      subheadline: "Join us — we're launching soon!",
      description: "100% free & easy. What's next?",
    };
    expect(() => validatePageConfig(config)).not.toThrow();
  });
});

// ─── HERO ─────────────────────────────────────────────────────────────────────

describe('HERO section validation', () => {
  function hero(content: Record<string, unknown>) {
    return withSection('HERO', { ...content, ...signupContent(), ...featuresContent(), ...faqContent(), ...socialContent(), ...footerContent() });
  }

  function signupContent() { return {}; /* filled via withSection for SIGNUP separately */ }
  function featuresContent() { return {}; }
  function faqContent() { return {}; }
  function socialContent() { return {}; }
  function footerContent() { return {}; }

  it('accepts a valid headline', () => {
    expect(() => validatePageConfig(withAllRequired())).not.toThrow();
  });

  it('rejects empty headline', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: '', subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).toThrow('Headline is required.');
  });

  it('rejects whitespace-only headline', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: '   ', subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).toThrow('Headline is required.');
  });

  it('rejects headline over 100 characters', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'A'.repeat(101), subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).toThrow('Headline must be 100 characters or less.');
  });

  it('accepts headline at exactly 100 characters', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'A'.repeat(100), subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).not.toThrow();
  });

  it('accepts empty subheadline (optional)', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'Welcome', subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).not.toThrow();
  });

  it('rejects subheadline over 160 characters', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'Welcome', subheadline: 'A'.repeat(161), description: '' };
    expect(() => validatePageConfig(config)).toThrow('Subheadline must be 160 characters or less.');
  });

  it('accepts empty description (optional)', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'Welcome', subheadline: '', description: '' };
    expect(() => validatePageConfig(config)).not.toThrow();
  });

  it('rejects description over 300 characters', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = { headline: 'Welcome', subheadline: '', description: 'A'.repeat(301) };
    expect(() => validatePageConfig(config)).toThrow('Description must be 300 characters or less.');
  });
});

// ─── FEATURES ─────────────────────────────────────────────────────────────────

describe('FEATURES section validation', () => {
  function validFeatures(items: Array<{ title: string; description: string }> = [{ title: 'Fast', description: 'Very fast indeed.' }]) {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FEATURES')!.content = { title: 'Our Features', items: JSON.stringify(items) };
    return config;
  }

  it('accepts a valid features configuration', () => {
    expect(() => validatePageConfig(validFeatures())).not.toThrow();
  });

  it('rejects missing section title', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FEATURES')!.content = { title: '', items: JSON.stringify([{ title: 'Fast', description: 'Very fast.' }]) };
    expect(() => validatePageConfig(config)).toThrow('Features title is required.');
  });

  it('rejects section title over 100 characters', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FEATURES')!.content = { title: 'A'.repeat(101), items: JSON.stringify([{ title: 'F', description: 'D' }]) };
    expect(() => validatePageConfig(config)).toThrow('Features title must be 100 characters or less.');
  });

  it('rejects zero features', () => {
    expect(() => validatePageConfig(validFeatures([]))).toThrow('You must have at least 1 feature.');
  });

  it('rejects more than 6 features', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ title: `Feature ${i + 1}`, description: 'Description.' }));
    expect(() => validatePageConfig(validFeatures(items))).toThrow('You can have a maximum of 6 features.');
  });

  it('accepts exactly 6 features', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ title: `Feature ${i + 1}`, description: 'Description.' }));
    expect(() => validatePageConfig(validFeatures(items))).not.toThrow();
  });

  it('rejects missing feature title', () => {
    expect(() => validatePageConfig(validFeatures([{ title: '', description: 'Description.' }]))).toThrow('Feature 1 title is required.');
  });

  it('rejects feature title over 60 characters', () => {
    expect(() => validatePageConfig(validFeatures([{ title: 'A'.repeat(61), description: 'Description.' }]))).toThrow('Feature 1 title must be 60 characters or less.');
  });

  it('rejects missing feature description', () => {
    expect(() => validatePageConfig(validFeatures([{ title: 'Title', description: '' }]))).toThrow('Feature 1 description is required.');
  });

  it('rejects feature description over 250 characters', () => {
    expect(() => validatePageConfig(validFeatures([{ title: 'Title', description: 'A'.repeat(251) }]))).toThrow('Feature 1 description must be 250 characters or less.');
  });
});

// ─── FAQ ──────────────────────────────────────────────────────────────────────

describe('FAQ section validation', () => {
  function validFaq(items: Array<{ question: string; answer: string }> = [{ question: 'What is this?', answer: 'A great product.' }]) {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FAQ')!.content = { title: 'Frequently Asked Questions', items: JSON.stringify(items) };
    return config;
  }

  it('accepts a valid FAQ configuration', () => {
    expect(() => validatePageConfig(validFaq())).not.toThrow();
  });

  it('rejects missing FAQ title', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FAQ')!.content = { title: '', items: JSON.stringify([{ question: 'Q?', answer: 'A.' }]) };
    expect(() => validatePageConfig(config)).toThrow('FAQ title is required.');
  });

  it('rejects zero FAQs', () => {
    expect(() => validatePageConfig(validFaq([]))).toThrow('You must have at least 1 FAQ.');
  });

  it('rejects more than 20 FAQs', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({ question: `Question ${i + 1}?`, answer: 'Answer.' }));
    expect(() => validatePageConfig(validFaq(items))).toThrow('You can have a maximum of 20 FAQs.');
  });

  it('accepts exactly 20 FAQs', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ question: `Question ${i + 1}?`, answer: 'Answer.' }));
    expect(() => validatePageConfig(validFaq(items))).not.toThrow();
  });

  it('rejects missing question', () => {
    expect(() => validatePageConfig(validFaq([{ question: '', answer: 'Answer.' }]))).toThrow('FAQ 1 question is required.');
  });

  it('rejects question over 150 characters', () => {
    expect(() => validatePageConfig(validFaq([{ question: 'Q'.repeat(151), answer: 'Answer.' }]))).toThrow('FAQ 1 question must be 150 characters or less.');
  });

  it('rejects missing answer', () => {
    expect(() => validatePageConfig(validFaq([{ question: 'What?', answer: '' }]))).toThrow('FAQ 1 answer is required.');
  });

  it('rejects answer over 1000 characters', () => {
    expect(() => validatePageConfig(validFaq([{ question: 'What?', answer: 'A'.repeat(1001) }]))).toThrow('FAQ 1 answer must be 1000 characters or less.');
  });

  it('rejects exact duplicate questions', () => {
    const items = [
      { question: 'What is WaitlistOS?', answer: 'Answer A.' },
      { question: 'What is WaitlistOS?', answer: 'Answer B.' },
    ];
    expect(() => validatePageConfig(validFaq(items))).toThrow('already exists');
  });

  it('rejects case-insensitive duplicate questions', () => {
    const items = [
      { question: 'What is WaitlistOS?', answer: 'Answer A.' },
      { question: 'what is waitlistos?', answer: 'Answer B.' },
    ];
    expect(() => validatePageConfig(validFaq(items))).toThrow('already exists');
  });

  it('rejects duplicate questions with extra whitespace', () => {
    const items = [
      { question: 'What is WaitlistOS?', answer: 'Answer A.' },
      { question: '  what is  waitlistos?  ', answer: 'Answer B.' },
    ];
    expect(() => validatePageConfig(validFaq(items))).toThrow('already exists');
  });
});

// ─── SIGNUP (Waitlist Form) ───────────────────────────────────────────────────

describe('SIGNUP section validation', () => {
  function validSignup(content: Record<string, unknown>) {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'SIGNUP')!.content = content;
    return config;
  }

  it('accepts a valid signup form', () => {
    expect(() => validatePageConfig(withAllRequired())).not.toThrow();
  });

  it('rejects missing form title', () => {
    expect(() => validatePageConfig(validSignup({ title: '', subtitle: '' }))).toThrow('Form title is required.');
  });

  it('rejects whitespace-only form title', () => {
    expect(() => validatePageConfig(validSignup({ title: '   ', subtitle: '' }))).toThrow('Form title is required.');
  });

  it('rejects form title over 100 characters', () => {
    expect(() => validatePageConfig(validSignup({ title: 'A'.repeat(101), subtitle: '' }))).toThrow('Form title must be 100 characters or less.');
  });

  it('accepts empty subtitle (optional)', () => {
    expect(() => validatePageConfig(validSignup({ title: 'Join us', subtitle: '' }))).not.toThrow();
  });

  it('rejects subtitle over 200 characters', () => {
    expect(() => validatePageConfig(validSignup({ title: 'Join us', subtitle: 'A'.repeat(201) }))).toThrow('Form subtitle must be 200 characters or less.');
  });
});

// ─── SOCIAL_PROOF ─────────────────────────────────────────────────────────────

describe('SOCIAL_PROOF section validation', () => {
  function validSocialProof(content: Record<string, unknown>) {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'SOCIAL_PROOF')!.content = content;
    return config;
  }

  const validContent = { title: 'Loved by early adopters', description: '', screenshotUrl: 'https://example.com/screenshot.png' };

  it('accepts a valid social proof section', () => {
    expect(() => validatePageConfig(validSocialProof(validContent))).not.toThrow();
  });

  it('rejects missing title', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, title: '' }))).toThrow('Social proof title is required.');
  });

  it('rejects title over 100 characters', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, title: 'A'.repeat(101) }))).toThrow('Social proof title must be 100 characters or less.');
  });

  it('accepts empty description (optional)', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, description: '' }))).not.toThrow();
  });

  it('rejects description over 300 characters', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, description: 'A'.repeat(301) }))).toThrow('Social proof description must be 300 characters or less.');
  });

  it('rejects missing screenshot (empty string)', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, screenshotUrl: '' }))).toThrow('Social proof screenshot is required.');
  });

  it('rejects missing screenshot (undefined)', () => {
    const { screenshotUrl: _removed, ...withoutUrl } = validContent;
    expect(() => validatePageConfig(validSocialProof(withoutUrl))).toThrow('Social proof screenshot is required.');
  });

  it('rejects invalid screenshot URL (no protocol)', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, screenshotUrl: 'not-a-url' }))).toThrow('Social proof screenshot URL is invalid.');
  });

  it('rejects screenshot with script injection', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, screenshotUrl: 'https://example.com/img.png<script>alert(1)</script>' }))).toThrow(BadRequestException);
  });

  it('accepts https URLs', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, screenshotUrl: 'https://cdn.example.com/img.webp' }))).not.toThrow();
  });

  it('accepts http URLs (for development environments)', () => {
    expect(() => validatePageConfig(validSocialProof({ ...validContent, screenshotUrl: 'http://localhost:3000/img.png' }))).not.toThrow();
  });
});

// ─── FOOTER ───────────────────────────────────────────────────────────────────

describe('FOOTER section validation', () => {
  function validFooter(content: Record<string, unknown>) {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'FOOTER')!.content = content;
    return config;
  }

  const validContent = { title: 'WaitlistOS', text: 'All rights reserved.' };

  it('accepts a valid footer', () => {
    expect(() => validatePageConfig(validFooter(validContent))).not.toThrow();
  });

  it('rejects missing title', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, title: '' }))).toThrow('Footer title is required.');
  });

  it('rejects title over 100 characters', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, title: 'A'.repeat(101) }))).toThrow('Footer title must be 100 characters or less.');
  });

  it('rejects missing footer text', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, text: '' }))).toThrow('Footer text is required.');
  });

  it('rejects whitespace-only footer text', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, text: '    ' }))).toThrow('Footer text is required.');
  });

  it('rejects footer text over 500 characters', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, text: 'A'.repeat(501) }))).toThrow('Footer text must be 500 characters or less.');
  });

  it('accepts footer text at exactly 500 characters', () => {
    expect(() => validatePageConfig(validFooter({ ...validContent, text: 'A'.repeat(500) }))).not.toThrow();
  });
});

// ─── End-to-end valid config ───────────────────────────────────────────────────

describe('end-to-end valid configuration', () => {
  it('accepts a complete, fully-populated config', () => {
    expect(() => validatePageConfig(withAllRequired())).not.toThrow();
  });

  it('returns the validated config with normalised section order', () => {
    const result = validatePageConfig(withAllRequired());
    result.sections.forEach((section, index) => {
      expect(section.order).toBe(index);
    });
  });

  it('preserves optional empty fields without error', () => {
    const config = withAllRequired();
    config.sections.find((s) => s.type === 'HERO')!.content = {
      headline: 'Welcome',
      subheadline: '',
      description: '',
    };
    expect(() => validatePageConfig(config)).not.toThrow();
  });
});
