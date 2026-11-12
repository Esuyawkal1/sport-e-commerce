import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import Layout from './components/layout/Layout.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

// Pages
import HomePage              from './pages/home/HomePage.jsx';
import CatalogPage           from './pages/catalog/CatalogPage.jsx';
import ProductDetailPage     from './pages/catalog/ProductDetailPage.jsx';
import CartPage              from './pages/cart/CartPage.jsx';
import WishlistPage          from './pages/wishlist/WishlistPage.jsx';
import CheckoutPage          from './pages/checkout/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/orders/OrderConfirmationPage.jsx';
import OrdersPage            from './pages/orders/OrdersPage.jsx';
import OrderDetailPage       from './pages/orders/OrderDetailPage.jsx';
import VendorDashboardPage   from './pages/vendor/VendorDashboardPage.jsx';
import AdminDashboardPage    from './pages/admin/AdminDashboardPage.jsx';
import AdminCategoriesPage   from './pages/admin/AdminCategoriesPage.jsx';
import AdminVendorsPage      from './pages/admin/AdminVendorsPage.jsx';
import NotFoundPage          from './pages/NotFoundPage.jsx';
import LoginPage             from './pages/auth/LoginPage.jsx';
import RegisterPage          from './pages/auth/RegisterPage.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Routes>

              {/* Auth pages */}
              <Route
                path="/login"
                element={
                  <Layout>
                    <LoginPage />
                  </Layout>
                }
              />
              <Route
                path="/register"
                element={
                  <Layout>
                    <RegisterPage />
                  </Layout>
                }
              />

              {/* Public Storefront pages */}
              <Route
                path="/"
                element={
                  <Layout>
                    <HomePage />
                  </Layout>
                }
              />
              <Route
                path="/catalog"
                element={
                  <Layout>
                    <CatalogPage />
                  </Layout>
                }
              />
              <Route
                path="/products/:productId"
                element={
                  <Layout>
                    <ProductDetailPage />
                  </Layout>
                }
              />

              {/* Shopping Cart (Customer Cart) */}
              <Route
                path="/cart"
                element={
                  <Layout>
                    <CartPage />
                  </Layout>
                }
              />

              {/* Saved Wishlist Items */}
              <Route
                path="/wishlist"
                element={
                  <Layout>
                    <WishlistPage />
                  </Layout>
                }
              />

              {/* Protected Checkout & Order History */}
              <Route
                path="/checkout"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/orders"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/orders/:orderId"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/orders/:orderId/confirmation"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <OrderConfirmationPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />

              {/* Vendor Management Dashboard */}
              <Route
                path="/vendor/dashboard"
                element={
                  <Layout>
                    <ProtectedRoute role="vendor">
                      <VendorDashboardPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />

              {/* Admin Portal & Management */}
              <Route
                path="/admin"
                element={
                  <Layout>
                    <ProtectedRoute role="admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <Layout>
                    <ProtectedRoute role="admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <Layout>
                    <ProtectedRoute role="admin">
                      <AdminCategoriesPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/admin/vendors"
                element={
                  <Layout>
                    <ProtectedRoute role="admin">
                      <AdminVendorsPage />
                    </ProtectedRoute>
                  </Layout>
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <Layout>
                    <NotFoundPage />
                  </Layout>
                }
              />

            </Routes>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);
}
