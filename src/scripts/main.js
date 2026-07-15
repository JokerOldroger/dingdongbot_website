import { navigationItems } from '../data/home.js';

const header = document.querySelector('[data-site-header]');
const nav = document.querySelector('[data-site-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const hero = document.querySelector('[data-hero]');
const parallaxTargets = document.querySelectorAll('[data-parallax]');
const revealTargets = document.querySelectorAll('.reveal');
const introScene = document.querySelector('.intro-scene');
const introVideo = document.querySelector('[data-intro-video]');
const featureItems = document.querySelectorAll('[data-feature-item]');
const functionStoryRows = document.querySelectorAll('[data-function-step]');
const INTRO_VIDEO_SCROLL_MULTIPLIER = 6;
let introVideoProgress = 0;

const syncHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
};

const closeNav = () => {
  nav?.classList.remove('is-open');
  navToggle?.classList.remove('is-open');
  navToggle?.setAttribute('aria-expanded', 'false');
};

const setupMobileNav = () => {
  navToggle?.addEventListener('click', () => {
    const willOpen = !nav?.classList.contains('is-open');
    nav?.classList.toggle('is-open', willOpen);
    navToggle.classList.toggle('is-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
  });

  nav?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNav();
  });
};

const setupParallax = () => {
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const washX = Math.min(Math.max((event.clientX - rect.left) / rect.width * 100, 52), 88);
    const washY = Math.min(Math.max((event.clientY - rect.top) / rect.height * 100, 20), 68);

    hero.style.setProperty('--hero-wash-x', `${washX}%`);
    hero.style.setProperty('--hero-wash-y', `${washY}%`);

    parallaxTargets.forEach((target) => {
      const depth = target.dataset.parallax === 'robot' ? 30 : -10;
      target.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
    });
  });

  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-wash-x', '74%');
    hero.style.setProperty('--hero-wash-y', '36%');

    parallaxTargets.forEach((target) => {
      target.style.transform = '';
    });
  });
};

const setupReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach((target) => observer.observe(target));
};

const setupActiveNav = () => {
  const sections = navigationItems
    .filter((item) => item.href.startsWith('#'))
    .map((item) => document.querySelector(item.href))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        nav?.querySelectorAll('a').forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-40% 0px -48% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
};

const setActiveFeature = (activeIndex) => {
  featureItems.forEach((item, index) => {
    item.classList.toggle('is-active', index === activeIndex);
  });
};

const syncFeatureFromVideoProgress = () => {
  if (featureItems.length === 0) return;

  const activeIndex = Math.min(
    featureItems.length - 1,
    Math.floor(introVideoProgress * featureItems.length)
  );

  setActiveFeature(activeIndex);
};

const syncFeatureProgress = () => {
  if (introVideo) {
    syncFeatureFromVideoProgress();
    return;
  }

  if (!introScene || featureItems.length === 0) return;

  const rect = introScene.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const activeIndex = Math.min(featureItems.length - 1, Math.floor(clampedProgress * featureItems.length));

  setActiveFeature(activeIndex);
};

const applyIntroVideoProgress = () => {
  if (!introScene || !introVideo || !Number.isFinite(introVideo.duration) || introVideo.duration <= 0) return;

  const clampedProgress = Math.min(Math.max(introVideoProgress, 0), 1);
  const targetTime = clampedProgress * Math.max(introVideo.duration - 0.08, 0);

  if (Math.abs(introVideo.currentTime - targetTime) > 0.033) {
    introVideo.currentTime = targetTime;
  }

  syncFeatureFromVideoProgress();
};

const setupFeatureHover = () => {
  featureItems.forEach((item, index) => {
    item.addEventListener('pointerenter', () => setActiveFeature(index));
    item.addEventListener('focus', () => setActiveFeature(index));
  });
};

const setupIntroVideo = () => {
  if (!introVideo) return;

  introVideo.pause();

  const primeVideo = () => {
    introVideo.pause();
    applyIntroVideoProgress();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    introVideo.currentTime = 0;
    return;
  }

  if (introVideo.readyState >= 1) {
    primeVideo();
  } else {
    introVideo.addEventListener('loadedmetadata', primeVideo, { once: true });
  }
};

const setupIntroVideoWheelControl = () => {
  if (!introScene || !introVideo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isIntroSceneInPlayRange = () => {
    const rect = introScene.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewportHeight * 0.88 && rect.bottom > viewportHeight * 0.18;
  };

  const resetIntroVideo = () => {
    introVideoProgress = 0;
    applyIntroVideoProgress();
  };

  window.addEventListener(
    'wheel',
    (event) => {
      if (!Number.isFinite(event.deltaY) || event.deltaY <= 0) return;
      if (!isIntroSceneInPlayRange()) return;
      if (introVideoProgress >= 1) return;

      const progressDelta =
        event.deltaY /
        Math.max(introScene.offsetHeight / INTRO_VIDEO_SCROLL_MULTIPLIER, 1);

      introVideoProgress = Math.min(introVideoProgress + progressDelta, 1);
      applyIntroVideoProgress();
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY <= 8 && introVideoProgress !== 0) {
        resetIntroVideo();
      }
    },
    { passive: true }
  );
};

const setupFunctionStory = () => {
  if (functionStoryRows.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    functionStoryRows.forEach((row, index) => {
      row.classList.add('is-seen');
      row.classList.toggle('is-current', index === 0);
    });
    return;
  }

  const seenObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        seenObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.28 }
  );

  const currentObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length === 0) return;

      const currentRow = visibleEntries[0].target;
      functionStoryRows.forEach((row) => {
        row.classList.toggle('is-current', row === currentRow);
      });
    },
    {
      threshold: [0.2, 0.35, 0.5, 0.7],
      rootMargin: '-32% 0px -32% 0px',
    }
  );

  functionStoryRows.forEach((row, index) => {
    seenObserver.observe(row);
    currentObserver.observe(row);

    row.addEventListener('pointerenter', () => {
      functionStoryRows.forEach((item) => item.classList.toggle('is-current', item === row));
    });

    if (index === 0) {
      row.classList.add('is-current');
    }
  });
};

window.addEventListener('scroll', () => {
  syncHeader();
  syncFeatureProgress();
}, { passive: true });
window.addEventListener('resize', () => {
  closeNav();
  syncFeatureProgress();
  applyIntroVideoProgress();
});

syncHeader();
syncFeatureProgress();
setupIntroVideo();
setupIntroVideoWheelControl();
applyIntroVideoProgress();
setupMobileNav();
setupParallax();
setupReveal();
setupActiveNav();
setupFeatureHover();
setupFunctionStory();
