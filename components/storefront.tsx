"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingBag, UserRound, Wallet, Menu, X, ChevronDown, ArrowRight, MapPin,
  Sparkles, Truck, ShieldCheck, Headphones, Smartphone, Zap, Heart,
  Plus, Minus, Trash2, CreditCard, Clock3, CheckCircle2,
  ChevronRight, Grid2X2, LogIn, Home as HomeIcon, Monitor, Shirt, House, PanelLeftClose, PanelLeftOpen, Tag, Package
} from "lucide-react";

type Product = { id: number; name: string; category: string; price: number; oldPrice: number; rating: string; tag: string; emoji: string; color: string };
type CartItem = Product & { qty: number };

const categories = [
  { name: "Mobiles & Tablets", icon: "📱", subs: ["Smartphones", "Keypad Phones", "Tablets & iPads", "Mobile Accessories", "Power Banks", "Screen Guards"] },
  { name: "Computers & Laptops", icon: "💻", subs: ["Laptops", "Desktop Computers", "Monitors", "Keyboards & Mouse", "Printers", "Storage Devices"] },
  { name: "Electronics", icon: "🎧", subs: ["Headphones", "Speakers", "Cameras", "Smart Watches", "Smart Devices", "Cables & Chargers"] },
  { name: "TV & Entertainment", icon: "📺", subs: ["Smart TVs", "LED TVs", "Projectors", "Home Theatre", "Streaming Devices"] },
  { name: "Home Appliances", icon: "🏠", subs: ["Refrigerators", "Washing Machines", "Air Conditioners", "Microwave Ovens", "Fans", "Water Purifiers"] },
  { name: "Fashion – Men", icon: "👔", subs: ["Shirts", "T-Shirts", "Jeans", "Trousers", "Footwear", "Watches"] },
  { name: "Fashion – Women", icon: "👗", subs: ["Sarees", "Kurtis", "Dresses", "Handbags", "Footwear", "Jewellery"] },
  { name: "Fashion – Kids", icon: "🧸", subs: ["Baby Wear", "Boys Clothing", "Girls Clothing", "Kids Footwear", "School Essentials"] },
  { name: "Beauty & Personal Care", icon: "✨", subs: ["Skincare", "Haircare", "Makeup", "Fragrances", "Men's Grooming"] },
  { name: "Grocery & Food", icon: "🥑", subs: ["Rice & Grains", "Pulses", "Cooking Oil", "Snacks", "Beverages", "Packaged Foods"] },
  { name: "Furniture", icon: "🛋️", subs: ["Sofas", "Beds", "Tables", "Chairs", "Wardrobes", "Office Furniture"] },
  { name: "Home & Kitchen", icon: "🍳", subs: ["Cookware", "Kitchen Tools", "Storage", "Home Decor", "Bedding", "Lighting"] },
  { name: "Books & Stationery", icon: "📚", subs: ["Books", "Notebooks", "Pens", "Art Supplies", "Office Supplies"] },
  { name: "Sports & Fitness", icon: "🏸", subs: ["Gym Equipment", "Sports Gear", "Fitness Accessories", "Outdoor Sports", "Yoga"] },
  { name: "Toys & Baby Products", icon: "🚂", subs: ["Educational Toys", "Soft Toys", "Baby Care", "Baby Furniture", "Strollers"] },
  { name: "Automotive", icon: "🚗", subs: ["Car Accessories", "Bike Accessories", "Spare Parts", "Car Care", "Helmets"] },
  { name: "Tools & Hardware", icon: "🛠️", subs: ["Power Tools", "Hand Tools", "Electrical", "Plumbing", "Safety Equipment"] },
  { name: "Health & Wellness", icon: "🩺", subs: ["Healthcare Devices", "Personal Wellness", "First Aid", "Mobility Aids"] },
  { name: "Jewellery & Accessories", icon: "💍", subs: ["Fashion Jewellery", "Gold Jewellery", "Silver Jewellery", "Watches", "Sunglasses"] },
  { name: "Pet Supplies", icon: "🐾", subs: ["Pet Food", "Pet Toys", "Grooming", "Pet Accessories"] },
  { name: "Musical Instruments", icon: "🎸", subs: ["Guitars", "Keyboards", "Drums", "Audio Accessories"] },
  { name: "Industrial Supplies", icon: "🏭", subs: ["Machinery", "Industrial Tools", "Safety Equipment", "Packaging"] },
  { name: "Garden & Outdoor", icon: "🪴", subs: ["Plants", "Gardening Tools", "Outdoor Furniture", "Outdoor Lighting"] },
  { name: "Travel & Luggage", icon: "🧳", subs: ["Suitcases", "Backpacks", "Travel Accessories", "Wallets"] },
  { name: "Art & Craft", icon: "🎨", subs: ["Painting", "Craft Materials", "Handmade Products", "DIY Kits"] },
  { name: "Digital Products", icon: "🖥️", subs: ["Software", "E-books", "Digital Subscriptions", "Gift Cards"] },
];

const products: Product[] = [
  { id: 1, name: "AeroSound Wireless Headphones", category: "Electronics", price: 2499, oldPrice: 3999, rating: "4.8", tag: "BESTSELLER", emoji: "🎧", color: "lavender" },
  { id: 2, name: "Nova X5 5G Smartphone", category: "Mobiles & Tablets", price: 14999, oldPrice: 17999, rating: "4.7", tag: "HOT DEAL", emoji: "📱", color: "blue" },
  { id: 3, name: "Minimal Ceramic Table Lamp", category: "Home & Kitchen", price: 1299, oldPrice: 1899, rating: "4.6", tag: "NEW", emoji: "💡", color: "peach" },
  { id: 4, name: "Everyday Classic Sneakers", category: "Fashion – Men", price: 1899, oldPrice: 2599, rating: "4.5", tag: "TRENDING", emoji: "👟", color: "mint" },
  { id: 5, name: "PulseFit Smart Watch", category: "Electronics", price: 3299, oldPrice: 4999, rating: "4.6", tag: "HOT DEAL", emoji: "⌚", color: "pink" },
  { id: 6, name: "BrewMate Coffee Maker", category: "Home Appliances", price: 2799, oldPrice: 3499, rating: "4.4", tag: "POPULAR", emoji: "☕", color: "cream" },
  { id: 7, name: "Urban Carry Backpack", category: "Travel & Luggage", price: 999, oldPrice: 1499, rating: "4.5", tag: "VALUE PICK", emoji: "🎒", color: "peach" },
  { id: 8, name: "Studio Wireless Speaker", category: "Electronics", price: 2199, oldPrice: 2999, rating: "4.7", tag: "BESTSELLER", emoji: "🔊", color: "blue" },
];

const money = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Storefront() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSearch = params.get("search");
    if (requestedSearch && requestedSearch !== "1") setQuery(requestedSearch);
    const requestedCategory = params.get("category");
    if (requestedCategory === "Electronics") setActiveCategory("Electronics");
    if (requestedCategory === "Fashion") setActiveCategory("Fashion – Men");
    if (requestedCategory === "Home Appliances") setActiveCategory("Home Appliances");
  }, []);
  useEffect(() => {
    const openCart = () => setCartOpen(true);
    window.addEventListener("amirthaa:open-cart", openCart);
    return () => window.removeEventListener("amirthaa:open-cart", openCart);
  }, []);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeSent, setRechargeSent] = useState(false);
  const [selectedSub, setSelectedSub] = useState("");

  const filtered = useMemo(() => products.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
  ), [query, activeCategory]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === p.id);
      return found ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
    setLastAddedProduct(p);
    setJustAddedId(p.id);
    window.setTimeout(() => setJustAddedId(current => current === p.id ? null : current), 1350);
  };
  const updateQty = (id: number, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <main>
      <header className="header header-v2">
        <div className="website-switcher" aria-label="Main websites">
          <button className="website-tab website-tab-active" type="button" aria-label="1252's Grow With Us"><img className="website-logo-image" src="/images/1252-logo.png" alt="1252's Grow With Us" /></button>
          <button className="website-tab" type="button"><span className="website-logo-placeholder">Logo 2</span></button>
        </div>
        <div className="location-search-row header-login-row">
          <div className="header-actions header-actions-v2">
            <button className="action-link account-trigger" onClick={() => window.location.assign("/wallet")}><Wallet size={19}/><span>Wallet</span></button><button className="action-link account-trigger" onClick={() => window.location.assign("/login")}><UserRound size={20}/><span>Login</span></button>
          </div>
        </div>
      </header>

      {categoryOpen && <section className="mega-menu">
        <div className="mega-head"><div><span className="eyebrow">EXPLORE OUR STORE</span><h3>Shop by category</h3></div><button className="icon-btn" onClick={() => setCategoryOpen(false)}><X/></button></div>
        <div className="category-grid">{categories.map(c => <div className="category-column" key={c.name}><button className="category-title" onClick={() => {setActiveCategory(c.name);setCategoryOpen(false);}}><span>{c.icon}</span>{c.name}<ChevronRight size={14}/></button>{c.subs.map(s => <button className="subcategory" key={s} onClick={() => {setActiveCategory(c.name);setSelectedSub(s);setCategoryOpen(false);}}>{s}</button>)}</div>)}</div>
      </section>}

      <section className="hero wrap">
        <div className="hero-copy"><span className="hero-pill"><Sparkles size={14}/> THE NEW WAY TO SHOP</span><h1>Find your next<br/><em>favourite thing.</em></h1><p>Thoughtfully picked essentials, exciting discoveries and everyday favourites — all in one place.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => {setActiveCategory("All");setSelectedSub("");document.getElementById("products")?.scrollIntoView({behavior:"smooth"});}}>Explore collection <ArrowRight size={17}/></button><button className="text-btn" onClick={() => setRechargeOpen(true)}>Recharge your mobile <Zap size={16}/></button></div><div className="hero-proof"><span>✦ Curated finds</span><span>✦ Great value</span><span>✦ Easy shopping</span></div></div>
        <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-card hero-card-main"><span className="floating-label">JUST FOR YOU</span><div className="hero-product-emoji">🛍️</div><div className="hero-card-bottom"><span>Everyday discoveries</span><strong>Made delightful.</strong></div></div><div className="float-card float-top"><span>✦</span><div><b>Fresh finds</b><small>Picked for you</small></div></div><div className="float-card float-bottom"><span>♡</span><div><b>Love your choice</b><small>Shop with confidence</small></div></div></div>
      </section>

      <section className="benefits wrap">
        <div><Truck/><span><b>Convenient shopping</b><small>From everyday to extraordinary</small></span></div>
        <div><ShieldCheck/><span><b>Secure experience</b><small>Your trust matters to us</small></span></div>
        <div><Headphones/><span><b>Customer support</b><small>Here when you need us</small></span></div>
      </section>

      <section className="quick-cats wrap" id="categories">
        <div className="section-heading"><div><span className="eyebrow">A WORLD OF CHOICE</span><h2>Explore categories</h2></div><button className="text-btn" onClick={() => setCategoryOpen(true)}>View all categories <ArrowRight size={16}/></button></div>
        <div className="quick-cat-row">{categories.slice(0, 9).map(c => <button className={`quick-cat ${activeCategory === c.name ? "selected" : ""}`} key={c.name} onClick={() => {setActiveCategory(c.name);setSelectedSub("");}}><span>{c.icon}</span><b>{c.name}</b></button>)}</div>
      </section>

      <section className="products-section wrap" id="products">
        <div className="section-heading"><div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>{activeCategory === "All" ? "Popular right now" : activeCategory}</h2><p>{selectedSub ? `Browsing ${selectedSub}` : "A few things we think you'll love."}</p></div><button className="outline-btn" onClick={() => {setActiveCategory("All");setSelectedSub("");}}>View all products <ArrowRight size={15}/></button></div>
        <div className="filter-row"><span>{filtered.length} products shown</span><button onClick={() => {setActiveCategory("All");setQuery("");}}>Clear filters <X size={13}/></button></div>
        {filtered.length ? <div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}><div className={`product-art ${p.color}`}><span className="product-tag">{p.tag}</span><button className="heart-btn" aria-label="Save item"><Heart size={17}/></button><div>{p.emoji}</div></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><div className="rating">★ {p.rating} <small> · Customer favourite</small></div><div className="price-row"><strong>{money(p.price)}</strong><del>{money(p.oldPrice)}</del><span>{Math.round((1-p.price/p.oldPrice)*100)}% off</span></div><button className={`add-btn ${justAddedId === p.id ? "add-btn-added" : ""}`} onClick={() => addToCart(p)}>{justAddedId === p.id ? <><CheckCircle2 size={16}/> Added</> : <><Plus size={16}/> Add to cart</>}</button></div></article>)}</div> : <div className="empty-state"><Search/><h3>No products found</h3><p>Try another search or explore all products.</p><button className="primary-btn" onClick={() => {setQuery("");setActiveCategory("All");}}>Show all products</button></div>}
      </section>

      <section className="recharge-banner wrap" id="recharge"><div className="recharge-icon"><Smartphone size={34}/></div><div><span className="eyebrow">QUICK & CONVENIENT</span><h2>Recharge, without the hassle.</h2><p>Submit your mobile recharge request. Our team will process it manually after payment confirmation.</p></div><button className="primary-btn" onClick={() => setRechargeOpen(true)}>Recharge now <ArrowRight size={17}/></button></section>

      <footer className="footer"><div className="footer-main"><div className="brand footer-brand"><span className="brand-mark">A</span><span>SRI AMIRTHAA<small>SHOPPING, REIMAGINED</small></span></div><p>A more thoughtful place for all the things you need and love.</p><div className="footer-links"><a href="#products">Shop</a><a href="#products">Categories</a><button onClick={() => setRechargeOpen(true)}>Recharge</button><a href="/admin">Admin</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Sri Amirthaa. All rights reserved.</span><span>Built for a better everyday.</span></div></footer>


      {cart.length > 0 && <div className="cart-float-bar" role="status" aria-live="polite">
        <div className="cart-float-product"><span>{lastAddedProduct?.emoji || "🛍️"}</span></div>
        <div className="cart-float-copy"><strong>{lastAddedProduct ? "Added to your cart" : "Your cart is ready"}</strong><small>{cartCount} {cartCount === 1 ? "item" : "items"} · {money(subtotal)}</small></div>
        <button className="cart-float-view" onClick={() => setCartOpen(true)}>View cart <ArrowRight size={16}/></button>
      </div>}

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Shopping cart ({cartCount})</h2></div><button className="icon-btn" onClick={() => setCartOpen(false)}><X/></button></div>{cart.length ? <><div className="cart-items">{cart.map(i => <div className="cart-item" key={i.id}><div className={`cart-emoji ${i.color}`}>{i.emoji}</div><div className="cart-item-info"><b>{i.name}</b><strong>{money(i.price)}</strong><div className="qty"><button onClick={() => updateQty(i.id,-1)}><Minus size={13}/></button><span>{i.qty}</span><button onClick={() => updateQty(i.id,1)}><Plus size={13}/></button><button className="remove" onClick={() => updateQty(i.id,-i.qty)}><Trash2 size={14}/></button></div></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><small>Shipping and taxes calculated at checkout.</small><button className="primary-btn full" onClick={() => window.location.assign("/login")}>Continue to checkout <ArrowRight size={16}/></button></div></> : <div className="empty-state"><ShoppingBag/><h3>Your cart is waiting</h3><p>Add something lovely to get started.</p></div>}</aside></div>}



      {rechargeOpen && <div className="overlay modal-overlay" onClick={() => {setRechargeOpen(false);setRechargeSent(false);}}><section className="modal recharge-modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-btn" onClick={() => {setRechargeOpen(false);setRechargeSent(false);}}><X/></button>{rechargeSent ? <div className="success-state"><CheckCircle2/><h2>Request details captured</h2><p>This is a front-end demo. No payment was collected and no recharge was submitted to an operator.</p><button className="primary-btn full" onClick={() => {setRechargeOpen(false);setRechargeSent(false);}}>Done</button></div> : <><span className="eyebrow">RECHARGE & DIGITAL SERVICES</span><h2>Mobile recharge</h2><p>Enter your details. Manual processing and payment will be connected after the payment workflow is configured.</p><form onSubmit={e => {e.preventDefault();setRechargeSent(true);}}><label>Mobile number</label><input className="field" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit mobile number"/><label>Operator</label><select className="field" required defaultValue=""><option value="" disabled>Select operator</option><option>Jio</option><option>Airtel</option><option>Vi</option><option>BSNL</option></select><label>Recharge amount (₹)</label><input className="field" required type="number" min="10" max="10000" placeholder="Enter amount"/><div className="processing-note"><Clock3 size={17}/><span>Manual processing usually takes around 2–5 minutes after payment confirmation. Actual time may vary.</span></div><button className="primary-btn full" type="submit">Review request <ArrowRight size={16}/></button></form></>}</section></div>}
    </main>
  );
}
