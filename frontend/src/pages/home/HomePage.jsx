import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Dumbbell,
} from "lucide-react";
import { getCategories, getProducts } from "../../api/catalog.api.js";
import Button from "../../components/ui/Button.jsx";
import CategoryShelf from "../../components/catalog/CategoryShelf.jsx";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getCategories({ isActive: true }).catch(() => ({ categories: [] })),
      getProducts({ limit: 100 }).catch(() => ({ products: [] })),
    ])
      .then(([catData, prodData]) => {
        if (!isMounted) return;
        setCategories(catData?.categories || []);
        setAllProducts(prodData?.products || []);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle URL hash on initial load or navigation (e.g. #category-boxing-gear)
  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el =
        document.getElementById(id) ||
        document.querySelector(
          `[data-category-slug="${id.replace("category-", "")}"]`,
        );
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [loading]);

  // Group products by category, prioritizing Boxing Gear, Football, Free Weights, etc.
  const categoryShelves = useMemo(() => {
    if (!categories.length) return [];

    const shelves = categories
      .map((cat) => {
        // Find direct child category IDs if this is a parent category
        const childCategoryIds = categories
          .filter((c) => c.parentCategoryId === cat.categoryId)
          .map((c) => c.categoryId);

        const matchedProducts = allProducts.filter((product) => {
          // Direct category ID match
          if (product.categoryId === cat.categoryId) return true;
          // Subcategory match (if product is in child of this parent category)
          if (childCategoryIds.includes(product.categoryId)) return true;
          // Sport type tag match
          if (
            Array.isArray(product.sportType) &&
            product.sportType.some(
              (s) => s.toLowerCase() === cat.slug?.toLowerCase(),
            )
          ) {
            return true;
          }
          return false;
        });

        return {
          category: cat,
          products: matchedProducts,
        };
      })
      .filter((shelf) => shelf.products.length > 0);

    // Specific order preference requested by user:
    // Boxing Gear, Football, Free Weights, Tennis, Basketball, Badminton, Cardio Machines, etc.
    const prioritySlugs = [
      "boxing-gear",
      "football",
      "free-weights-barbells",
      "tennis",
      "basketball",
      "badminton",
      "cardio-machines",
      "team-sports",
      "racket-sports",
      "fitness-strength",
      "combat-sports",
    ];

    return shelves.sort((a, b) => {
      const aIndex = prioritySlugs.indexOf(a.category.slug);
      const bIndex = prioritySlugs.indexOf(b.category.slug);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return (a.category.displayOrder || 0) - (b.category.displayOrder || 0);
    });
  }, [categories, allProducts]);

  return (
    <div className="flex flex-col gap-14 pb-16">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center gap-5 pt-4 pb-2">
        {/* Ambient glow blob */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[280px] rounded-full bg-brand-accent/15 blur-3xl pointer-events-none"
        />

        <h1 className="relative z-10 max-w-4xl font-display uppercase text-6xl md:text-7xl text-text-primary leading-none tracking-tight">
          Gear up for <span className="text-brand-accent">every sport</span>,
          <br />
          excel at every level.
        </h1>

        <p className="relative z-10 max-w-xl font-sans font-normal text-base sm:text-lg text-text-muted leading-relaxed">
          Shop professional equipment, athletic footwear, and specialized
          training gear from verified sports vendors worldwide.
        </p>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/catalog">
            <Button size="lg" className="shadow-glow">
              Explore Catalog <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Categories Down Hero Section With Horizontal Products ───────── */}
      {loading ? (
        <div className="flex flex-col gap-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <CategoryShelf
              key={i}
              category={{
                name: "Loading Category...",
                description: "Fetching equipment",
              }}
              products={[]}
              loading={true}
            />
          ))}
        </div>
      ) : categoryShelves.length > 0 ? (
        <div className="flex flex-col gap-14">
          {categoryShelves.map((shelf) => (
            <CategoryShelf
              key={shelf.category.categoryId}
              category={shelf.category}
              products={shelf.products}
              loading={false}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-brand-surface border border-brand-border rounded-2xl flex flex-col items-center gap-3">
          <Dumbbell size={32} className="text-text-muted" />
          <h3 className="text-base font-bold text-text-primary">
            No products found
          </h3>
          <Link to="/catalog">
            <Button size="sm" variant="outline">
              Browse Catalog
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
