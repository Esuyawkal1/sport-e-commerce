import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="size-20 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-accent mb-6 shadow-glow">
        <Compass size={40} />
      </div>
      <span className="text-xs font-bold text-brand-accent uppercase tracking-wider mb-2">
        Error 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">
        Page Off Course
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button size="md">Return Home</Button>
        </Link>
        <Link to="/catalog">
          <Button variant="outline" size="md" className="flex items-center gap-1.5">
            <span>Browse Catalog</span>
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
