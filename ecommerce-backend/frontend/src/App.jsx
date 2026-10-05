import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api';

//   UPI ID  (PhonePe / GPay / Paytm)
const STORE_UPI_ID = 'ashish727582-2@oksbi';
const STORE_NAME = 'AK ShopSphere';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ak_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authModal, setAuthModal] = useState({ open: false, isSignup: false });
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Profile & Tracking
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  // Guest Tracking
  const [guestTrackModalOpen, setGuestTrackModalOpen] = useState(false);
  const [guestOrderIdInput, setGuestOrderIdInput] = useState('');
  const [guestTrackResult, setGuestTrackResult] = useState(null);
  const [guestTrackLoading, setGuestTrackLoading] = useState(false);
  const [guestTrackError, setGuestTrackError] = useState('');

  // Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'COD'
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState(null);

  const trackingStages = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const fetchProducts = async () => {
    try {
      setErrorMessage('');
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setErrorMessage('Server connection offline. Please verify backend service.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchUserOrders = async (email) => {
    if (!email) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setUserOrders(list);
      setSelectedOrderForTracking(list.length > 0 ? list[0] : null);
    } catch (err) {
      setUserOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openProfileDashboard = () => {
    if (!currentUser) {
      setAuthModal({ open: true, isSignup: false });
      return;
    }
    setProfileModalOpen(true);
    fetchUserOrders(currentUser.email);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authModal.isSignup ? '/auth/signup' : '/auth/login';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
      } else {
        const userData = { email: data.email, fullName: data.fullName };
        setCurrentUser(userData);
        localStorage.setItem('ak_user', JSON.stringify(userData));
        setAuthModal({ open: false, isSignup: false });
        setAuthForm({ fullName: '', email: '', password: '' });
        setNotification({ type: 'success', text: `Welcome back, ${data.fullName}!` });
      }
    } catch (err) {
      setAuthError('Unable to connect to authentication server.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ak_user');
    setCurrentUser(null);
    setProfileModalOpen(false);
    setNotification({ type: 'success', text: 'You have been logged out securely.' });
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert('Maximum stock quantity reached for this item.');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const initiatePayment = () => {
    if (!currentUser) {
      alert('Please log in or register before checking out.');
      setAuthModal({ open: true, isSignup: false });
      return;
    }
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setPaymentModalOpen(true);
  };

  // Complete Payment & Place Order
  const processFinalOrder = async () => {
    setPaymentProcessing(true);
    setNotification(null);

    const payload = {
      customerEmail: currentUser.email,
      paymentMethod: paymentMethod,
      items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
    };

    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', text: data.error || 'Payment transaction rejected.' });
      } else {
        setNotification({
          type: 'success',
          text: `Payment of ₹${cartTotal} confirmed via ${paymentMethod}! Order #${data.orderId} Placed. Check your Gmail for the receipt.`,
        });
        setCart([]);
        setPaymentModalOpen(false);
        setUpiRefNumber('');
        fetchProducts();
      }
    } catch (err) {
      setNotification({ type: 'error', text: 'Payment gateway timeout. Please retry.' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleGuestTrack = async (e) => {
    e.preventDefault();
    if (!guestOrderIdInput.trim()) return;
    setGuestTrackLoading(true);
    setGuestTrackError('');
    setGuestTrackResult(null);

    try {
      const res = await fetch(`${API_BASE}/orders/track/${guestOrderIdInput.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setGuestTrackError(data.error || 'Order record not found.');
      } else {
        setGuestTrackResult(data);
      }
    } catch (err) {
      setGuestTrackError('Tracking server offline.');
    } finally {
      setGuestTrackLoading(false);
    }
  };

  const totalUserSpend = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Dynamic NPCI UPI Link Generator
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(STORE_UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent('AKShopSphere Order')}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <div className="bg-indigo-950 text-indigo-200 text-xs py-2 px-6 text-center font-medium tracking-wide">
          Official AK ShopSphere Portal • Real-Time Inventory & Secure UPI Gateway
        </div>

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 py-4 shadow-xs flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center shadow-md text-white font-black text-lg">
              AK
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none">
                AK ShopSphere
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
                Official Electronics & Premium Gear
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGuestTrackModalOpen(true);
                setGuestTrackResult(null);
                setGuestTrackError('');
              }}
              className="text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>Quick Track</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={openProfileDashboard}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span>{currentUser.fullName}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer px-2 py-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModal({ open: true, isSignup: false })}
                  className="text-sm text-slate-700 font-bold px-3 py-1.5 hover:text-indigo-600 transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal({ open: true, isSignup: true })}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm shadow-indigo-200 transition cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <span>Cart</span>
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </button>
          </div>
        </header>

        {/* Product Catalog */}
        <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          {notification && (
            <div
              className={`p-4 mb-8 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              <span>{notification.text}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-xs uppercase tracking-wider font-bold cursor-pointer opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Catalog</h2>
              <p className="text-sm text-slate-500 mt-1">High-performance tech peripherals and workstations.</p>
            </div>
            <button
              onClick={fetchProducts}
              className="self-start md:self-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition cursor-pointer"
            >
              ↻ Refresh Stock
            </button>
          </div>

          {errorMessage ? (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto">
              <p className="text-rose-700 font-semibold text-sm mb-2">{errorMessage}</p>
              <button
                onClick={fetchProducts}
                className="text-xs bg-rose-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-700 transition"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading inventory catalog...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition duration-200 group"
                >
                  <div className="relative overflow-hidden bg-slate-100 h-52">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span
                      className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs ${
                        p.stockQuantity > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {p.stockQuantity > 0 ? `${p.stockQuantity} In Stock` : 'Sold Out'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Price</span>
                        <span className="text-lg font-black text-slate-950">₹{p.price}</span>
                      </div>

                      <button
                        disabled={p.stockQuantity === 0}
                        onClick={() => addToCart(p)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* --- 100% SCREEN-FIT COMPACT PAYMENT GATEWAY MODAL --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden my-auto animate-fade-in">

            {/* 1. TOP HEADER (Fixed Close Button) */}
            <div className="bg-slate-950 px-4 py-3 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔒</span>
                <div>
                  <h3 className="text-xs font-black tracking-tight">AK ShopSphere Payment</h3>
                  <p className="text-[10px] text-slate-400">Direct NPCI Bank Settlement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-rose-600 hover:text-white flex items-center justify-center text-slate-300 font-bold text-xs transition cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* 2. AMOUNT STRIP */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500">Amount to Pay</span>
                <p className="text-base font-black text-slate-950 leading-tight">₹{cartTotal}</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                ✓ Verified Merchant
              </span>
            </div>

            {/* 3. SCROLLABLE MIDDLE BODY */}
            <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5">
              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: '⚡' },
                  { id: 'CARD', label: 'Card', icon: '💳' },
                  { id: 'COD', label: 'Cash on Del.', icon: '💵' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-1.5 px-1 rounded-xl border flex flex-col items-center gap-0.5 transition cursor-pointer text-xs ${
                      paymentMethod === m.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="text-sm">{m.icon}</span>
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* UPI Tab */}
              {paymentMethod === 'UPI' && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-center bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-700 mb-1">Scan with GPay / PhonePe / Paytm</p>
                    <div className="bg-white p-1 rounded-lg border border-slate-100 inline-block shadow-xs">
                      <img
                        src={upiQrUrl}
                        alt="Scan UPI QR"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      UPI ID: <span className="font-mono font-bold text-indigo-700">{STORE_UPI_ID}</span>
                    </div>

                    <a
                      href={upiDeepLink}
                      className="mt-1.5 block w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[10px] rounded-lg transition shadow-xs"
                    >
                      📱 Open UPI App (Pay ₹{cartTotal})
                    </a>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      UPI Ref / UTR No. (Optional after paying)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 423981290812"
                      value={upiRefNumber}
                      onChange={(e) => setUpiRefNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {paymentMethod === 'CARD' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Ashish Kumar"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8892"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-indigo-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">CVV</label>
                      <input
                        type="password"
                        maxLength="3"
                        placeholder="•••"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* COD Tab */}
              {paymentMethod === 'COD' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <span>💵</span> Cash on Delivery
                  </p>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Pay <b>₹{cartTotal}</b> in cash or scan delivery agent's UPI code when the package arrives.
                  </p>
                </div>
              )}
            </div>

            {/* 4. FIXED BOTTOM BUTTON (Always Visible) */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={processFinalOrder}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md text-xs flex items-center justify-center gap-1.5"
              >
                {paymentProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>I Have Paid ₹{cartTotal} — Confirm Order</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">Your Cart</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((a, b) => a + b.quantity, 0)} Items
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-4 max-h-[55vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">Your cart is currently empty.</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                          ₹{item.quantity * item.price}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex justify-between font-black text-xl text-slate-950">
                <span>Subtotal:</span>
                <span className="text-indigo-600">₹{cartTotal}</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={initiatePayment}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment</span>
                <span>💳</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Track Modal */}
      {guestTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setGuestTrackModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1">🔍 Quick Track Shipment</h3>
            <p className="text-xs text-slate-500 mb-4">Enter any Order ID to check real-time dispatch progress.</p>

            <form onSubmit={handleGuestTrack} className="flex gap-2 mb-4">
              <input
                type="number"
                required
                placeholder="Enter Order ID (e.g. 1)"
                value={guestOrderIdInput}
                onChange={(e) => setGuestOrderIdInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={guestTrackLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                {guestTrackLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {guestTrackError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 mb-3">
                {guestTrackError}
              </div>
            )}

            {guestTrackResult && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between font-bold mb-2">
                  <span>Order #{guestTrackResult.orderId}</span>
                  <span className="text-indigo-600">₹{guestTrackResult.totalAmount}</span>
                </div>
                <div className="flex justify-between text-slate-500 mb-3">
                  <span>Status:</span>
                  <span className="font-black text-indigo-700">{guestTrackResult.status || 'CONFIRMED'}</span>
                </div>
                <p className="text-[10px] text-slate-400">Order Placed on: {guestTrackResult.orderDate?.slice(0, 10)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {profileModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 px-8 py-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{currentUser.fullName}</h3>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50/70 border-b border-indigo-100 px-8 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Orders</span>
                <span className="text-lg font-black text-indigo-950">{userOrders.length} Completed</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Spent</span>
                <span className="text-lg font-black text-indigo-950">₹{totalUserSpend}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Membership</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Verified Buyer
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-5 divide-y divide-slate-100 max-h-[50vh] md:max-h-full">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Order History</h4>
                {ordersLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading order log...</div>
                ) : userOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">No purchases found for your account.</div>
                ) : (
                  userOrders.map((ord) => {
                    const isSelected = selectedOrderForTracking && selectedOrderForTracking.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrderForTracking(ord)}
                        className={`p-3.5 rounded-xl cursor-pointer transition mb-1.5 ${
                          isSelected
                            ? 'bg-indigo-50/90 border border-indigo-200 shadow-xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sm text-slate-900">Order #{ord.id}</span>
                          <span className="text-sm font-black text-slate-950">₹{ord.totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                          <span>{ord.orderDate ? ord.orderDate.slice(0, 10) : 'Recent'}</span>
                          <span className="font-bold text-indigo-700 uppercase bg-indigo-100/60 px-2 py-0.5 rounded">
                            {ord.status || 'CONFIRMED'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="md:col-span-7 p-6 overflow-y-auto bg-slate-50/50 flex flex-col justify-between">
                {selectedOrderForTracking ? (
                  <div>
                    <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-6">
                      <div>
                        <span className="text-xs font-black uppercase text-indigo-600 tracking-wider block">Live Tracking</span>
                        <h4 className="text-lg font-black text-slate-950">Order #{selectedOrderForTracking.id}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Total Billed</span>
                        <span className="text-base font-black text-slate-900">₹{selectedOrderForTracking.totalAmount}</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6">
                      <p className="text-xs font-bold text-slate-700 mb-6">Shipment Timeline</p>
                      <div className="relative flex justify-between items-center px-4">
                        <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-slate-200 -translate-y-1/2 z-0" />
                        <div
                          className="absolute top-1/2 left-6 right-6 h-1.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                          style={{
                            width: `${
                              (Math.max(
                                0,
                                trackingStages.indexOf(selectedOrderForTracking.status?.toUpperCase() || 'CONFIRMED')
                              ) /
                                (trackingStages.length - 1)) *
                              90
                            }%`,
                          }}
                        />
                        {trackingStages.map((stage, idx) => {
                          const activeIdx = Math.max(
                            0,
                            trackingStages.indexOf(selectedOrderForTracking.status?.toUpperCase() || 'CONFIRMED')
                          );
                          const isDone = idx <= activeIdx;
                          return (
                            <div key={stage} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs transition ${
                                  isDone ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 mt-2 capitalize">
                                {stage.toLowerCase()}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-8 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="font-black text-indigo-700 bg-white border border-indigo-100 px-3 py-1 rounded-md shadow-xs">
                          {selectedOrderForTracking.status || 'CONFIRMED'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
                      ℹ An official invoice has been dispatched to <b>{selectedOrderForTracking.customerEmail}</b>.
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    Select an order from the left to view live shipment tracking.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-7 rounded-2xl w-full max-w-sm shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setAuthModal({ open: false, isSignup: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-slate-950 tracking-tight mb-1">
              {authModal.isSignup ? 'Create Customer Account' : 'Sign in to AK ShopSphere'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">Access your order history and live shipment tracking.</p>

            {authError && (
              <div className="p-3 mb-4 text-xs font-semibold bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authModal.isSignup && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Ashish Kumar"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-sm cursor-pointer shadow-sm shadow-indigo-200 mt-2"
              >
                {authModal.isSignup ? 'Register Account' : 'Authenticate & Sign In'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              {authModal.isSignup ? (
                <>
                  Already registered?{' '}
                  <span
                    onClick={() => {
                      setAuthError('');
                      setAuthModal({ open: true, isSignup: false });
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  New customer?{' '}
                  <span
                    onClick={() => {
                      setAuthError('');
                      setAuthModal({ open: true, isSignup: true });
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Register Account
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                AK
              </div>
              <span className="text-xl font-black text-white tracking-tight">AK ShopSphere</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Empowering creators and professionals with verified consumer hardware and automated ACID order reliability.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Account</h4>
            <ul className="space-y-2.5 text-xs">
              <li><button onClick={openProfileDashboard} className="hover:text-white transition cursor-pointer">My Profile & Orders</button></li>
              <li><button onClick={() => setGuestTrackModalOpen(true)} className="hover:text-white transition cursor-pointer">Live Order Tracking</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-white transition">Return Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Warranty Claims</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Support</h4>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Email</span>
              <a href="mailto:raunkrathour5@gmail.com" className="text-indigo-400 font-semibold hover:underline block break-all">
                raunkrathour5@gmail.com
              </a>
              <span className="text-slate-500 block text-[10px] uppercase font-bold mt-2">Phone</span>
              <span className="text-white font-bold">+91 7272******</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 bg-black/40 py-5 text-center text-xs text-slate-500">
          © 2026 AK ShopSphere. High-concurrency enterprise commerce.
        </div>
      </footer>
    </div>
  );
}