import AdminSidebar from './AdminSidebar.jsx';

/**
 * Admin Control Center Layout.
 * Pairs the clean AdminSidebar with page content, providing
 * unified desktop multi-column control and mobile-optimized responsiveness.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 w-full">
      <AdminSidebar />
      <div className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
