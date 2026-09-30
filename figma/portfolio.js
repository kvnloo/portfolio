/* Framework-free companion to the original Figma shell. No network requests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.FigmaPortfolio = api;
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => api.initFigmaPortfolio(root.document, root), { once: true });
    } else api.initFigmaPortfolio(root.document, root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const pages = ['about', 'contact', 'experience', 'services', 'resources', 'community'];
  const employers = ['zero', 'outlier', 'sabbatical', 'slalom', 'synchrony', 'amazon', 'bcbs', 'prenosis', 'wipro', 'bytebros'];
  const titles = { about: 'About', contact: 'Contact', experience: 'Professional Experience', services: 'Services', resources: 'Resources', community: 'Projects & Community' };
  const names = { zero: 'zero, LLC', outlier: 'Outlier / Scale AI', sabbatical: 'Sabbatical', slalom: 'Slalom Consulting', synchrony: 'Synchrony Financial', amazon: 'Amazon Web Services', bcbs: 'BlueCross BlueShield / HCSC', prenosis: 'Prenosis', wipro: 'Wipro Consulting', bytebros: 'ByteBros' };

  function parseFigmaRoute(hash) {
    const parts = String(hash || '').replace(/^#\//, '').split('/');
    if (parts.length === 1 && pages.includes(parts[0])) return { page: parts[0], employer: null };
    if (parts.length === 2 && parts[0] === 'experience' && employers.includes(parts[1])) return { page: 'experience', employer: parts[1] };
    return { page: 'experience', employer: null };
  }
  function routeHash(route) { return `#/${route.page}${route.employer ? `/${route.employer}` : ''}`; }

  function renderFigmaRoute(document, route, rememberedEmployer) {
    document.documentElement.dataset.page = route.page;
    document.documentElement.dataset.selectedEmployer = route.employer || 'overview';
    document.querySelectorAll('[data-screen]').forEach((screen) => { screen.hidden = screen.dataset.screen !== route.page; });
    document.querySelectorAll('.primary-nav [data-page]').forEach((link) => {
      if (link.dataset.page === (route.page === 'community' ? 'experience' : route.page)) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelector('[data-rail]').hidden = route.page !== 'experience' || !route.employer;
    document.querySelector('[data-career-select]').value = route.employer || rememberedEmployer || employers[0];
    document.querySelector('[data-overview]').hidden = Boolean(route.employer);
    document.querySelector('[data-role-view]').hidden = !route.employer;
    document.querySelectorAll('[data-employer-panel]').forEach((panel) => { panel.hidden = panel.dataset.employerPanel !== route.employer; });
    document.querySelectorAll('[data-employer]').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.employer === route.employer));
      tab.tabIndex = tab.dataset.employer === (route.employer || rememberedEmployer || employers[0]) ? 0 : -1;
    });
    const label = route.employer ? `${names[route.employer]} · Professional Experience` : titles[route.page];
    document.title = `${label} · Kevin Rajan`;
    document.querySelector('[data-route-status]').textContent = label;
  }

  function initFigmaPortfolio(document, window) {
    if (document.documentElement.dataset.figmaReady === 'true') return;
    document.documentElement.dataset.figmaReady = 'true';
    let currentRoute = parseFigmaRoute(window.location.hash);
    let rememberedEmployer = currentRoute.employer || employers[0];
    if (window.location.hash && window.location.hash !== routeHash(currentRoute)) window.history.replaceState(null, '', routeHash(currentRoute));
    renderFigmaRoute(document, currentRoute, rememberedEmployer);

    function navigate(route, focus) {
      const hash = routeHash(route);
      if (route.employer) rememberedEmployer = route.employer;
      if (hash !== routeHash(currentRoute)) window.history.pushState(null, '', hash);
      currentRoute = route;
      renderFigmaRoute(document, route, rememberedEmployer);
      if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
      if (focus === '#main') window.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
      if (focus?.startsWith('[data-story=')) document.querySelector(focus)?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
    }
    function restoreHistory() {
      const next = parseFigmaRoute(window.location.hash);
      if (window.location.hash !== routeHash(next)) window.history.replaceState(null, '', routeHash(next));
      if (next.employer) rememberedEmployer = next.employer;
      const focusedElement = document.activeElement;
      const identical = routeHash(next) === routeHash(currentRoute);
      currentRoute = next;
      if (!identical) renderFigmaRoute(document, next, rememberedEmployer);
      if (focusedElement?.closest('[hidden]')) document.querySelector('#main').focus({ preventScroll: true });
    }
    window.addEventListener('popstate', restoreHistory);
    window.addEventListener('hashchange', restoreHistory);

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-career-select]') && employers.includes(event.target.value)) navigate({ page: 'experience', employer: event.target.value }, '#main');
    });

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target.closest('.skip-link')) {
        event.preventDefault();
        const main = document.querySelector('#main');
        main.focus({ preventScroll: true });
        main.scrollIntoView?.({ block: 'start' });
        return;
      }
      const contribution = event.target.closest('[data-focus]');
      if (contribution && contribution.tagName === 'BUTTON') {
        const panel = contribution.closest('[data-employer-panel]');
        const selected = contribution.dataset.focus;
        panel.dataset.focus = selected;
        panel.querySelectorAll('button[data-focus]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.focus === selected)));
        panel.querySelectorAll('[data-contribution]').forEach((section) => { section.hidden = section.dataset.contribution !== selected; });
        panel.querySelectorAll('[data-model-label]').forEach((label) => { label.hidden = label.dataset.modelLabel !== selected; });
        return;
      }
      const anchor = event.target.closest('a[href^="#/"]');
      if (anchor) {
        event.preventDefault();
        const route = parseFigmaRoute(anchor.getAttribute('href'));
        navigate(route, anchor.hasAttribute('data-employer') ? null : '#main');
        return;
      }
      if (event.target.closest('[data-show-overview]')) navigate({ page: 'experience', employer: null }, `[data-story="${rememberedEmployer}"]`);
      if (event.target.closest('[data-next-employer]')) {
        const index = employers.indexOf(currentRoute.employer);
        const employer = employers[(index + 1) % employers.length];
        navigate({ page: 'experience', employer }, `[data-employer="${employer}"]`);
      }
    });
    document.addEventListener('keydown', (event) => {
      const tab = event.target.closest('[data-employer]');
      if (event.key === 'Escape' && currentRoute.page === 'experience' && currentRoute.employer) {
        event.preventDefault();
        navigate({ page: 'experience', employer: null }, `[data-story="${rememberedEmployer}"]`);
        return;
      }
      if (!tab) return;
      const index = employers.indexOf(tab.dataset.employer);
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % employers.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + employers.length - 1) % employers.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = employers.length - 1;
      if (event.key === ' ') { event.preventDefault(); navigate({ page: 'experience', employer: tab.dataset.employer }); return; }
      if (next !== undefined) {
        event.preventDefault();
        navigate({ page: 'experience', employer: employers[next] }, `[data-employer="${employers[next]}"]`);
      }
    });

  }
  return { parseFigmaRoute, renderFigmaRoute, initFigmaPortfolio };
});
