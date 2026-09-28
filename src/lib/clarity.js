/**
 * Microsoft Clarity Analytics Integration
 * Initializes Clarity tag once on client-side
 */
let isInitialized = false;

export const initClarity = () => {
  if (typeof window === 'undefined' || isInitialized) return;

  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (!projectId) return;

  try {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      if (y && y.parentNode) {
        y.parentNode.insertBefore(t, y);
      }
    })(window, document, 'clarity', 'script', projectId);

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Microsoft Clarity:', error);
  }
};
