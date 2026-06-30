import { navigationItems } from '../data/home.js';

const header = document.querySelector('[data-site-header]');
const nav = document.querySelector('[data-site-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const hero = document.querySelector('[data-hero]');
const parallaxTargets = document.querySelectorAll('[data-parallax]');
const revealTargets = document.querySelectorAll('.reveal');
const introScene = document.querySelector('.intro-scene');
const featureItems = document.querySelectorAll('[data-feature-item]');

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

const syncFeatureProgress = () => {
  if (!introScene || featureItems.length === 0) return;

  const rect = introScene.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const activeIndex = Math.min(featureItems.length - 1, Math.floor(clampedProgress * featureItems.length));

  setActiveFeature(activeIndex);
};

const setupFeatureHover = () => {
  featureItems.forEach((item, index) => {
    item.addEventListener('pointerenter', () => setActiveFeature(index));
    item.addEventListener('focus', () => setActiveFeature(index));
  });
};

window.addEventListener('scroll', () => {
  syncHeader();
  syncFeatureProgress();
}, { passive: true });
window.addEventListener('resize', closeNav);

syncHeader();
syncFeatureProgress();
setupMobileNav();
setupParallax();
setupReveal();
setupActiveNav();
setupFeatureHover();
