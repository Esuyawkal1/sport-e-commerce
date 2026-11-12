import { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/catalog.api.js';

export default function SubNavbar() {
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentCategoryId = searchParams.get('categoryId');

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
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (cat, e) => {
    e.preventDefault();
    const slug = cat.slug;
    const catId = cat.categoryId;

    const findTarget = () =>
      document.getElementById(`category-${slug}`) ||
      document.getElementById(`category-${catId}`) ||
      document.querySelector(`[data-category-slug="${slug}"]`);

    if (location.pathname === '/') {
      const element = findTarget();
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#category-${slug}`);
        return;
      }
    }

    // If on another page, navigate to homepage with the section hash
    navigate(`/#category-${slug}`);
  };

  return (
    <div className="w-full bg-brand-surface/95 border-t border-brand-border/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isActive = currentCategoryId === cat.categoryId;

          return (
            <button
              key={cat.categoryId}
              type="button"
              onClick={(e) => handleCategoryClick(cat, e)}
              title={`Jump to ${cat.name}`}
              className={`font-sans text-sm font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-brand-bg/60 border border-transparent'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
