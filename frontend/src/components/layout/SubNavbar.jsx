import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/catalog.api.js';

export default function SubNavbar() {
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isManualScrollRef = useRef(false);
  const manualTimerRef = useRef(null);
  const buttonRefs = useRef({});

  const currentCategoryId = searchParams.get('categoryId');

  // Single source of truth for the active category (strictly one active at a time)
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash.replace(/^#category-/, '').replace(/^#/, '');
    }
    return '';
  });

  // Load Categories
  useEffect(() => {
    let isMounted = true;
    getCategories({ isActive: true })
      .then((data) => {
        if (!isMounted) return;
        const list = data?.categories || [];
        // Sort so subcategories like Boxing, Football, Weights come first
        const sorted = [...list].sort((a, b) => {
          const aIsChild = Boolean(a.parentCategoryId);
          const bIsChild = Boolean(b.parentCategoryId);
          if (aIsChild && !bIsChild) return -1;
          if (!aIsChild && bIsChild) return 1;
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        });
        setCategories(sorted);

        // If no active category yet, initialize strictly to URL hash or first category
        setActiveCategory((current) => {
          if (current) return current;
          if (typeof window !== 'undefined' && window.location.hash) {
            return window.location.hash.replace(/^#category-/, '').replace(/^#/, '');
          }
          if (currentCategoryId) {
            return currentCategoryId;
          }
          return sorted[0]?.slug || sorted[0]?.categoryId || '';
        });
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCategoryId]);

  // Listen to browser hash changes (e.g. back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        const slug = window.location.hash.replace(/^#category-/, '').replace(/^#/, '');
        setActiveCategory(slug);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scrollspy: Activate exactly one category item when reached / showing on homepage
  useEffect(() => {
    if (location.pathname !== '/') return;

    const handleScroll = () => {
      if (isManualScrollRef.current) return;

      const sections = Array.from(
        document.querySelectorAll('section[data-category-slug], section[data-category-id]')
      );
      if (!sections.length) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // If user scrolled near the bottom of the page, activate the last visible category
      if (scrollY + viewportHeight >= docHeight - 80) {
        const last = sections[sections.length - 1];
        const key = last.getAttribute('data-category-slug') || last.getAttribute('data-category-id');
        if (key) setActiveCategory(key);
        return;
      }

      // Header offset below sticky Navbar + SubNavbar (~150px)
      const offset = 160;
      let currentKey = null;
      let closestDistance = Infinity;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        // Section is in viewing area
        if (rect.bottom > offset && rect.top <= viewportHeight * 0.6) {
          const dist = Math.abs(rect.top - offset);
          if (dist < closestDistance) {
            closestDistance = dist;
            currentKey = section.getAttribute('data-category-slug') || section.getAttribute('data-category-id');
          }
        }
      }

      if (currentKey) {
        setActiveCategory((prev) => {
          if (prev !== currentKey) {
            window.history.replaceState(null, '', `#category-${currentKey}`);
            return currentKey;
          }
          return prev;
        });
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, categories]);

  // Keep the active category button visible in horizontal scroll view
  useEffect(() => {
    if (!activeCategory) return;
    const btn = buttonRefs.current[activeCategory];
    if (btn) {
      btn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  const handleCategoryClick = (cat, e) => {
    e.preventDefault();
    const slug = cat.slug;
    const catId = cat.categoryId;
    const key = slug || catId;

    // Immediately activate only this clicked category
    setActiveCategory(key);
    isManualScrollRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 850);

    const findTarget = () =>
      document.getElementById(`category-${slug}`) ||
      document.getElementById(`category-${catId}`) ||
      document.querySelector(`[data-category-slug="${slug}"]`);

    if (location.pathname === '/') {
      const element = findTarget();
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#category-${key}`);
        return;
      }
    }

    // If on another page, navigate to homepage with the section hash
    navigate(`/#category-${key}`);
  };

  return (
    <div className="w-full bg-brand-surface/95 border-t border-brand-border/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-6 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const key = cat.slug || cat.categoryId;
          // Strictly only one category is selected at any time
          const isActive = activeCategory === key;

          return (
            <button
              key={cat.categoryId}
              ref={(el) => {
                if (el) buttonRefs.current[key] = el;
              }}
              type="button"
              onClick={(e) => handleCategoryClick(cat, e)}
              title={`Jump to ${cat.name}`}
              className={`relative h-11 flex items-center font-sans text-[15px] whitespace-nowrap transition-colors duration-200 cursor-pointer px-1 ${
                isActive
                  ? 'text-brand-accent font-bold'
                  : 'text-text-muted hover:text-text-primary font-semibold'
              }`}
            >
              <span>{cat.name}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-accent rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
