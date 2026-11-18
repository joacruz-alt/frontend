"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Package } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  product_id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  is_available: number;
  image_url?: string | null;
  imageUrl?: string | null;
  image?: string | null;
}

interface Order {
  order_id: number;
  user_id: number;
  status: string;
  total_amount: string | number;
  order_date: string;
}

interface User {
  user_id: number;
  username: string;
}

interface Category {
  category_id: number;
  name: string;
  description?: string;
}

interface Address {
  address_id: number;
  user_id: number;
  street: string;
  city: string;
  postal_code: string;
}

interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string | number;
}

interface Payment {
  payment_id: number;
  order_id: number;
  amount: string | number;
  method?: string;
  status?: string;
  transaction_id?: string;
  payment_date?: string;
}

const productImageSources: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["headphone", "earbud", "earphone", "speaker"],
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["phone", "mobile", "smartphone", "tablet"],
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["laptop", "computer", "notebook", "keyboard"],
    url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["shoe", "sneaker", "footwear"],
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["shirt", "jacket", "clothing", "dress", "hoodie"],
    url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["watch", "clock"],
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["camera", "lens"],
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["book", "novel"],
    url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    keywords: ["sofa", "chair", "table", "furniture", "desk"],
    url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=240&h=240&q=80",
  },
];

function ProductThumbnail({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const productName = product.name.toLowerCase();
  const matchedImage = productImageSources.find(({ keywords }) =>
    keywords.some((keyword) => productName.includes(keyword)),
  );
  const imageUrl = product.image_url || product.imageUrl || product.image || matchedImage?.url;

  return (
    <div
      className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#031d16]/65"
      role="img"
      aria-label={`${product.name} product image`}
    >
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          onError={() => setImageFailed(true)}
          className="size-full object-cover transition-transform duration-200 group-hover/thumbnail:scale-105"
        />
      ) : (
        <Package aria-hidden="true" className="size-6 text-emerald-100/45" strokeWidth={1.7} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isChecking) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const productRequest = apiClient<Product[]>("/products");

      const authenticatedRequests = Promise.allSettled([
        apiClient<Order[]>("/orders", { requiresAuth: true }),
        apiClient<User[]>("/users", { requiresAuth: true }),
        apiClient<Category[]>("/categories", { requiresAuth: true }),
        apiClient<Address[]>("/addresses", { requiresAuth: true }),
        apiClient<OrderItem[]>("/order-items", { requiresAuth: true }),
        apiClient<Payment[]>("/payments", { requiresAuth: true }),
      ]);

      try {
        const [productResult, authenticatedResult] = await Promise.all([
          productRequest,
          authenticatedRequests,
        ]);

        if (cancelled) return;

        setProducts(Array.isArray(productResult) ? productResult : []);

        const [
          ordersResult,
          usersResult,
          categoriesResult,
          addressesResult,
          orderItemsResult,
          paymentsResult,
        ] = authenticatedResult;
        setOrders(
          ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
            ? ordersResult.value
            : [],
        );
        setUsers(
          usersResult.status === "fulfilled" && Array.isArray(usersResult.value)
            ? usersResult.value
            : [],
        );
        setCategories(
          categoriesResult.status === "fulfilled" &&
            Array.isArray(categoriesResult.value)
            ? categoriesResult.value
            : [],
        );
        setAddresses(
          addressesResult.status === "fulfilled" &&
            Array.isArray(addressesResult.value)
            ? addressesResult.value
            : [],
        );
        setOrderItems(
          orderItemsResult.status === "fulfilled" &&
            Array.isArray(orderItemsResult.value)
            ? orderItemsResult.value
            : [],
        );
        setPayments(
          paymentsResult.status === "fulfilled" &&
            Array.isArray(paymentsResult.value)
            ? paymentsResult.value
            : [],
        );

        if (
          ordersResult.status === "rejected" ||
          usersResult.status === "rejected" ||
          categoriesResult.status === "rejected" ||
          addressesResult.status === "rejected" ||
          orderItemsResult.status === "rejected" ||
          paymentsResult.status === "rejected"
        ) {
          setError("Some dashboard data could not be loaded.");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [isChecking]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#0a3f34_0%,_#023020_35%,_#12070d_100%)] font-sans text-white/80">
        <p className="text-sm">Verifying session...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock_quantity || 0),
    0,
  );
  const orderRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );
  const dashboardCardClass =
    "rounded-2xl border border-emerald-100/10 bg-[#082d22]/85 text-[#edf5f0] shadow-lg shadow-black/10 ring-1 ring-white/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-[#0a3528] hover:shadow-emerald-950/30";
  const dataRowClass =
    "rounded-lg border border-white/[0.08] bg-[#031d16]/45 px-4 py-3 transition-colors duration-200 hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0a3f34_0%,_#023020_48%,_#12070d_100%)] px-4 py-8 font-sans text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 rounded-2xl border border-emerald-100/10 bg-[#06291f]/70 px-5 py-5 shadow-xl shadow-black/10 backdrop-blur-sm transition-colors duration-200 hover:border-emerald-300/30 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/75">Joji Store</p>
            <h1 className="mt-2 font-sans text-4xl font-medium leading-none tracking-[-0.03em] text-[#f2f5ee] sm:text-5xl">Dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/55">A considered overview of your store.</p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full rounded-lg border border-emerald-100/15 bg-emerald-50/10 text-emerald-50 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200/40 hover:bg-emerald-100/15 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-emerald-300/60 sm:w-auto"
          >
            Logout
          </Button>
        </header>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-emerald-50/90">At a glance</h2>
              <p className="mt-1 text-xs leading-5 text-emerald-50/50">Live totals from your database</p>
            </div>
            {loading && <span className="text-xs text-emerald-100/50">Updating...</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className={dashboardCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60">Order revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {loading ? "—" : `$${orderRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </p>
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{loading ? "—" : products.length}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-50/50">{totalStock} units in stock</p>
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{loading ? "—" : orders.length}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-50/50">{orderItems.length} order items</p>
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60">Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{loading ? "—" : users.length}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-50/50">{addresses.length} saved addresses</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100/90">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Products</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{products.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm leading-6 text-emerald-50/55">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No products found.</p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 6).map((product) => (
                    <div
                      key={product.product_id}
                      className={`group/thumbnail flex items-center justify-between gap-4 ${dataRowClass}`}
                    >
                      <ProductThumbnail product={product} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium tracking-tight text-[#edf5f0]">{product.name}</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-50/55">
                          Stock: {product.stock_quantity}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums tracking-tight text-emerald-50/90">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Orders</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{orders.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm leading-6 text-emerald-50/55">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No orders found.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 6).map((order) => (
                    <div
                      key={order.order_id}
                      className={`flex items-center justify-between ${dataRowClass}`}
                    >
                      <div>
                        <p className="font-medium tracking-tight text-[#edf5f0]">Order #{order.order_id}</p>
                        <p className="mt-1 text-xs capitalize leading-5 text-emerald-50/55">
                          {order.status}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums tracking-tight text-emerald-50/90">
                        ${Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Categories</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{categories.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No categories found.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.category_id} className={dataRowClass}>
                      <p className="font-medium tracking-tight text-[#edf5f0]">{category.name}</p>
                      {category.description && (
                        <p className="mt-1 text-sm leading-6 text-emerald-50/55">{category.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Addresses</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{addresses.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No addresses found.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.slice(0, 6).map((address) => (
                    <div key={address.address_id} className={dataRowClass}>
                      <p className="font-medium tracking-tight text-[#edf5f0]">{address.street}</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-50/55">
                        {address.city} {address.postal_code}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Order items</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{orderItems.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No order items found.</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.slice(0, 6).map((item) => (
                    <div key={item.order_item_id} className={`flex items-center justify-between ${dataRowClass}`}>
                      <div>
                        <p className="font-medium tracking-tight text-[#edf5f0]">Order #{item.order_id}</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-50/55">Product #{item.product_id} / Qty {item.quantity}</p>
                      </div>
                      <p className="font-semibold tabular-nums tracking-tight text-emerald-50/90">${Number(item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold tracking-[-0.02em] text-[#edf5f0]">Payments</CardTitle>
                <span className="text-xs font-medium tabular-nums text-emerald-100/50">{payments.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm leading-6 text-emerald-50/55">No payments found.</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 6).map((payment) => (
                    <div key={payment.payment_id} className={`flex items-center justify-between ${dataRowClass}`}>
                      <div>
                        <p className="font-medium tracking-tight text-[#edf5f0]">Order #{payment.order_id}</p>
                        <p className="mt-1 text-xs capitalize leading-5 text-emerald-50/55">
                          {payment.method || "Payment"} - {payment.status || "Unknown"}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums tracking-tight text-emerald-50/90">${Number(payment.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}