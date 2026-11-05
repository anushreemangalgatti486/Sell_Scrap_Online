import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import PolaroidLineCarousel from '../components/ui/PolaroidLineCarousel'
import { Marquee } from '../components/ui/Marquee'
import HowItWorks from '../components/ui/HowItWorks'
import {
  ShieldCheck, TrendingUp, Leaf, ArrowRight, ChevronRight,
  Factory, Zap, Package, Scale, FileCheck, Clock,
  Award, Users, BarChart3, Globe, CheckCircle2,
  Recycle, Truck, CreditCard, Bell, Star, Play,
  BadgeCheck, IndianRupee, Weight, Building2
} from 'lucide-react'
import './HomePage.css'

/* ─── static data ─── */
const STATS = [
  { value: '500+', label: 'Verified Sellers' },
  { value: '200+', label: 'Verified Buyers' },
  { value: '10K+', label: 'Tonnes Traded' },
  { value: '₹50Cr+', label: 'Trade Volume' },
]

/* Marquee items — richer version of STATS with icons, shown in the scrolling ticker */
const STATS_MARQUEE = [
  { icon: <BadgeCheck size={18} />,   value: '500+',    label: 'Verified Sellers' },
  { icon: <Users size={18} />,        value: '200+',    label: 'Verified Buyers' },
  { icon: <Weight size={18} />,       value: '10,000+', label: 'Tonnes Traded' },
  { icon: <IndianRupee size={18} />,  value: '₹50 Cr+', label: 'Trade Volume' },
  { icon: <ShieldCheck size={18} />,  value: '100%',    label: 'KYC Verified Network' },
  { icon: <Recycle size={18} />,      value: '8',       label: 'Material Categories' },
  { icon: <Building2 size={18} />,    value: 'Pan-India', label: 'Coverage' },
  { icon: <Leaf size={18} />,         value: 'Zero',    label: 'Middlemen' },
]

const WHY_CARDS = [
  { icon: <ShieldCheck size={28} />, title: 'Verified Network', desc: 'Every buyer and seller undergoes thorough KYC and business verification before accessing the marketplace.' },
  { icon: <TrendingUp   size={28} />, title: 'Competitive Bidding', desc: 'Live auctions ensure you always get the best market price — no middlemen, no hidden cuts.' },
  { icon: <Scale        size={28} />, title: 'Transparent Pricing', desc: 'All bids, quantities and prices are visible in real-time. Full digital audit trail for every transaction.' },
  { icon: <Package      size={28} />, title: 'Easy Discovery', desc: 'Search and filter thousands of scrap listings by category, grade, quantity and location.' },
  { icon: <FileCheck    size={28} />, title: 'Digital Documentation', desc: 'Auto-generated invoices, weighment slips and complete transaction history — all in one place.' },
  { icon: <Leaf         size={28} />, title: 'Greener Future', desc: 'Every tonne traded through ScrapBazaar is directed to verified recyclers — not backyard furnaces.' },
]

const CATEGORIES = [
  { icon: '⚙️', name: 'Iron & Steel',  desc: 'HMS, MS scrap, CI casting, steel turnings', color: '#475569' },
  { icon: '🔶', name: 'Copper',         desc: 'Wire, pipe, cable, bus bar, radiator', color: '#B45309' },
  { icon: '🔘', name: 'Aluminium',      desc: 'Cast, wrought, extrusion, UBC cans', color: '#6B7280' },
  { icon: '📦', name: 'Paper',          desc: 'OCC, newsprint, mixed paper, white', color: '#92400E' },
  { icon: '🧴', name: 'Plastic',        desc: 'HDPE, LDPE, PET, PP, PVC', color: '#1D4ED8' },
  { icon: '🪵', name: 'Wood',           desc: 'Pallet wood, timber offcuts, sawdust', color: '#78350F' },
  { icon: '💻', name: 'E-Waste',        desc: 'PCB, computers, cables, batteries', color: '#065F46' },
  { icon: '🏭', name: 'Industrial',     desc: 'Rubber, glass, chemicals, mixed', color: '#4C1D95' },
]

/* Carousel slides — one Unsplash photo per scrap category */
const TRADE_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=1800&auto=format&fit=crop',
    title: 'Iron & Steel',
    caption: 'HMS, MS scrap, CI casting, steel turnings',
    alt: 'Iron and steel scrap',
  },
  {
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1800&auto=format&fit=crop',
    title: 'Copper',
    caption: 'Wire, pipe, cable, bus bar, radiator',
    alt: 'Copper scrap wire',
  },
  {
    image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?q=80&w=1800&auto=format&fit=crop',
    title: 'Aluminium',
    caption: 'Cast, wrought, extrusion, UBC cans',
    alt: 'Aluminium scrap',
  },
  {
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1800&auto=format&fit=crop',
    title: 'Paper & Cardboard',
    caption: 'OCC, newsprint, mixed paper, white',
    alt: 'Paper recycling',
  },
  {
    image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=1800&auto=format&fit=crop',
    title: 'Plastic',
    caption: 'HDPE, LDPE, PET, PP, PVC',
    alt: 'Plastic scrap recycling',
  },
  {
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1800&auto=format&fit=crop',
    title: 'Wood & Timber',
    caption: 'Pallet wood, timber offcuts, sawdust',
    alt: 'Wood scrap pallet',
  },
  {
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1800&auto=format&fit=crop',
    title: 'E-Waste',
    caption: 'PCB, computers, cables, batteries',
    alt: 'Electronic waste',
  },
  {
    image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?q=80&w=1800&auto=format&fit=crop',
    title: 'Industrial Mixed',
    caption: 'Rubber, glass, chemicals, mixed lots',
    alt: 'Industrial scrap',
  },
]

const HOW_SELLER = [
  { step: '01', title: 'List Your Scrap', desc: 'Add material details, photos, quantity and set your starting price.' },
  { step: '02', title: 'Listing Goes Live', desc: 'Verified buyers receive instant notifications and start viewing your lot.' },
  { step: '03', title: 'Receive Bids', desc: 'Watch competitive bids roll in. Compare prices in real-time.' },
  { step: '04', title: 'Accept Best Offer', desc: 'Review the winning bid and accept. Pickup is coordinated for you.' },
  { step: '05', title: 'Get Paid Securely', desc: 'Payment is released once pickup and weighment are confirmed.' },
]

const HOW_BUYER = [
  { step: '01', title: 'Browse Listings', desc: 'Explore hundreds of verified scrap listings by material, grade and location.' },
  { step: '02', title: 'View Details', desc: 'Check photos, specifications, quantity and full seller credentials.' },
  { step: '03', title: 'Place Your Bid', desc: 'Submit a competitive bid. Raise it anytime before auction closes.' },
  { step: '04', title: 'Win the Lot', desc: 'If your bid wins, you receive an instant notification with all details.' },
  { step: '05', title: 'Pickup & Pay', desc: 'Coordinate pickup, confirm weighment and complete secure payment.' },
]

const FAQS = [
  { q: 'Is registration free?', a: 'Yes, registration is completely free for all buyers and sellers. You only need a plan to start listing or bidding on material lots.' },
  { q: 'What documents do I need to register?', a: 'You need basic business information: business name, type, authorized person details, contact information, and a valid business registration document or GSTIN. GSTIN is not mandatory for all business types.' },
  { q: 'How long does verification take?', a: 'Most accounts are verified within 24–48 working hours. You will receive an email and SMS confirmation once approved.' },
  { q: 'How does the bidding work?', a: 'Sellers list a material lot with a starting price and auction duration. Verified buyers place bids in real-time. The auction closes at the set time and the highest valid bid wins.' },
  { q: 'How are payments handled?', a: 'Buyer payments are processed securely through our integrated payment system and released to the seller only after pickup and weighment confirmation.' },
  { q: 'Do you operate across India?', a: 'Yes. ScrapBazaar has a pan-India network of verified buyers and sellers across all major industrial states.' },
]

/* ─── components ─── */
function CounterStat({ value, label }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat-value">{value}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <ChevronRight className={`faq-icon ${open ? 'open' : ''}`} size={18} />
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

/* ─── main page ─── */
export default function HomePage() {
  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="home-page">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="/hero-scrap.jpg"
            alt="Industrial scrap yard"
            className="hero-img"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="hero-overlay" />
        </div>

        <div className="container hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <ShieldCheck size={14} /> India's Verified B2B Scrap Marketplace
            </div>
            <h1 className="hero-title">
              Trade Scrap <span className="hero-highlight">Smarter.</span><br />
              Build <span className="hero-highlight-amber">Better.</span>
            </h1>
            <p className="hero-subtitle">
              A trusted platform connecting verified industrial scrap sellers with genuine buyers
              through transparent, real-time competitive bidding.
            </p>
            <div className="hero-pills">
              <div className="hero-pill"><ShieldCheck size={14} /> Verified Users</div>
              <div className="hero-pill"><TrendingUp  size={14} /> Transparent Pricing</div>
              <div className="hero-pill"><Leaf        size={14} /> Greener Planet</div>
            </div>
            <div className="hero-ctas">
              <Link to="/auth/register" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/buyers" className="btn btn-ghost btn-lg hero-ghost-btn">
                Explore Materials
              </Link>
            </div>
            <div className="hero-tagline">Recycle · Reuse · Rebuild — A Better Tomorrow</div>
          </div>

          <div className="hero-right">
            <div className="hero-card seller-card">
              <div className="hero-card-icon">
                <Factory size={32} />
              </div>
              <h3>Register as a Scrap Seller</h3>
              <p>List your scrap, get the best bids from verified buyers and sell with confidence.</p>
              <ul className="hero-card-features">
                <li><CheckCircle2 size={14} /> Get Maximum Price</li>
                <li><CheckCircle2 size={14} /> Secure Payments</li>
                <li><CheckCircle2 size={14} /> Complete Scrap History</li>
                <li><CheckCircle2 size={14} /> Wider Buyer Reach</li>
              </ul>
              <Link to="/auth/register?role=seller" className="btn btn-primary w-full">
                Get Started as Seller <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hero-card buyer-card">
              <div className="hero-card-icon buyer-icon">
                <Truck size={32} />
              </div>
              <h3>Register as a Scrap Buyer</h3>
              <p>Source quality scrap from verified sellers, get competitive prices and manage procurement.</p>
              <ul className="hero-card-features">
                <li><CheckCircle2 size={14} /> Access Verified Sellers</li>
                <li><CheckCircle2 size={14} /> Wider Supply Reach</li>
                <li><CheckCircle2 size={14} /> Easy Invoicing & Payments</li>
                <li><CheckCircle2 size={14} /> Consistent Quality Supply</li>
              </ul>
              <Link to="/auth/register?role=buyer" className="btn btn-amber w-full">
                Get Started as Buyer <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS MARQUEE ─── */}
      <section className="stats-bar">
        <Marquee speed={28} pauseOnHover gap="0px">
          {STATS_MARQUEE.map((item, i) => (
            <div key={i} className="stats-marquee-item">
              <span className="stats-marquee-icon">{item.icon}</span>
              <span className="stats-marquee-value">{item.value}</span>
              <span className="stats-marquee-label">{item.label}</span>
              <span className="stats-marquee-sep" aria-hidden="true">✦</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ─── OUR PROMISE ─── */}
      <section className="promise-section section-pad">
        <div className="container">
          <div className="promise-inner scroll-reveal">
            <div className="promise-label">Our Promise</div>
            <h2>Making Scrap Trading Simple, Transparent & Better for Everyone.</h2>
            <div className="promise-pillars">
              <div className="promise-pillar"><CheckCircle2 size={18} /> No Hidden Cuts</div>
              <div className="promise-pillar"><CheckCircle2 size={18} /> Transparent Bidding</div>
              <div className="promise-pillar"><CheckCircle2 size={18} /> End-to-End Documentation</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="section-pad why-section">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag"><Award size={14} /> Why ScrapBazaar</div>
            <h2 className="section-title">The Scrap Market Is Changing.</h2>
            <p className="section-subtitle">
              From offline deals and limited choices to a smarter way to discover, bid and trade scrap at scale.
            </p>
          </div>
          <div className="why-grid">
            {WHY_CARDS.map((c, i) => (
              <div key={i} className="why-card card card-hover scroll-reveal" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="why-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="comparison-section section-pad">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag"><Recycle size={14} /> The ScrapBazaar Way</div>
            <h2 className="section-title">One Listing. Multiple Buyers. Best Price.</h2>
          </div>
          <div className="comparison-grid">
            <div className="comparison-card traditional scroll-reveal">
              <div className="comparison-badge bad">Traditional Way</div>
              <h3>Many Hands. Many Cuts.</h3>
              <p>Your scrap passes through a chain of middlemen, and each one keeps a share of your value.</p>
              <div className="chain-flow">
                {['Scrap Seller', 'Kabadiwala', 'Local Dealer', 'Aggregator', 'Recycler', 'Buyer'].map((label, i, arr) => (
                  <React.Fragment key={i}>
                    <div className="chain-node bad-node">{label}</div>
                    {i < arr.length - 1 && <div className="chain-arrow bad-arrow">→ cut</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="comparison-card modern scroll-reveal">
              <div className="comparison-badge good">ScrapBazaar Way</div>
              <h3>Direct. Competitive. Better.</h3>
              <p>ScrapBazaar connects your scrap directly to verified buyers through live bidding — zero middlemen.</p>
              <div className="modern-flow">
                <div className="modern-node seller-node">
                  <div className="node-icon">📦</div>
                  <span>You List</span>
                </div>
                <div className="modern-arrow">⚡</div>
                <div className="modern-node platform-node">
                  <div className="node-icon">🏪</div>
                  <span>ScrapBazaar Live Bidding</span>
                </div>
                <div className="modern-arrow">⚡</div>
                <div className="modern-buyers">
                  {['Kabadiwala', 'Local Dealer', 'Aggregator', 'Recycler'].map((b, i) => (
                    <div key={i} className="modern-buyer-node">{b}</div>
                  ))}
                </div>
              </div>
              <div className="modern-steps">
                <span>✓ Best bid wins</span>
                <span>✓ Pickup & weighment</span>
                <span>✓ Secure payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section section-pad">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag"><Zap size={14} /> How It Works</div>
            <h2 className="section-title">Sellers list. Buyers bid. Best price wins.</h2>
            <p className="section-subtitle">Pickup, weighment and payment tracked in one place.</p>
          </div>
        </div>
        <HowItWorks
          sellerSteps={HOW_SELLER}
          buyerSteps={HOW_BUYER}
        />
      </section>

      {/* ─── MATERIAL CATEGORIES ─── */}
      <section className="categories-section section-pad">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag"><Package size={14} /> What You Can Trade</div>
            <h2 className="section-title">Every Kind of Scrap, One Marketplace</h2>
            <p className="section-subtitle">
              From factory floors to office clearances — every industrial material category in one place.
            </p>
          </div>
        </div>

        {/* Full-width polaroid carousel */}
        <PolaroidLineCarousel
          slides={TRADE_SLIDES}
          height={520}
          cardWidth={300}
          sag={50}
          swing={1}
          autoplay={4000}
          string="var(--brand-primary)"
          background="var(--bg-secondary)"
          ink="var(--text-primary)"
          ariaLabel="Scrap material categories carousel"
          className="categories-carousel"
        />

        <div className="container">
          <div className="categories-cta scroll-reveal">
            <Link to="/buyers" className="btn btn-primary">
              Explore All Materials <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOR SELLERS & BUYERS HIGHLIGHTS ─── */}
      <section className="highlights-section section-pad">
        <div className="container">
          <div className="highlights-grid">
            <div className="highlight-card highlight-seller scroll-reveal">
              <div className="highlight-label">For Scrap Sellers</div>
              <h2>Get the Best Price for Every Kilo</h2>
              <p>Stop depending on a single local dealer. Put your scrap in front of hundreds of verified buyers and let them compete for it.</p>
              <ul className="highlight-list">
                <li><CheckCircle2 size={16} /> <b>Competitive live bidding</b> — Multiple buyers bid on your lot. You choose the best offer.</li>
                <li><CheckCircle2 size={16} /> <b>Secure payments</b> — Funds are confirmed before pickup.</li>
                <li><CheckCircle2 size={16} /> <b>Compliance made easy</b> — Digital invoices and full transaction history.</li>
              </ul>
              <Link to="/sellers" className="btn btn-primary">
                Start Selling <ArrowRight size={16} />
              </Link>
            </div>

            <div className="highlight-card highlight-buyer scroll-reveal">
              <div className="highlight-label buyer-label">For Scrap Buyers</div>
              <h2>Reliable Supply, Zero Guesswork</h2>
              <p>Source consistent, quality raw material from verified sellers — and manage every purchase from one dashboard.</p>
              <ul className="highlight-list">
                <li><CheckCircle2 size={16} /> <b>KYC-verified sellers</b> — Every seller is checked before they list material.</li>
                <li><CheckCircle2 size={16} /> <b>Bulk procurement</b> — Filter by material, grade, quantity and location.</li>
                <li><CheckCircle2 size={16} /> <b>Easy invoicing</b> — GST-ready invoices and payment records in one place.</li>
              </ul>
              <Link to="/buyers" className="btn btn-amber">
                Start Buying <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST SECTION ─── */}
      <section className="trust-section section-pad">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag"><Star size={14} /> Built for Trust</div>
            <h2 className="section-title">We Handle Verification, Payments & Paperwork</h2>
            <p className="section-subtitle">So both buyers and sellers can focus entirely on the deal.</p>
          </div>
          <div className="trust-grid">
            {[
              { icon: <TrendingUp size={24} />, title: 'Real-Time Bidding', desc: 'Transparent, live bids so the true market price surfaces every day — not last week\'s rate card.' },
              { icon: <ShieldCheck size={24} />, title: 'Secure Payments', desc: 'Money is held safely and released only when both sides confirm pickup and weighment.' },
              { icon: <CheckCircle2 size={24} />, title: 'Verified Businesses', desc: 'KYC and business document checks for every seller and buyer before they go live on the platform.' },
              { icon: <FileCheck   size={24} />, title: 'Digital Invoicing', desc: 'Auto-generated invoices and complete transaction records accessible anytime.' },
              { icon: <BarChart3   size={24} />, title: 'Analytics & Reports', desc: 'Track your trading activity, revenue, and material demand with detailed dashboards.' },
              { icon: <Globe       size={24} />, title: 'Pan-India Network', desc: 'Buyers and sellers across all major industrial states — growing every day.' },
            ].map((t, i) => (
              <div key={i} className="trust-card card scroll-reveal">
                <div className="trust-icon">{t.icon}</div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="faq-section section-pad">
        <div className="container">
          <div className="section-header scroll-reveal">
            <div className="section-tag">FAQs</div>
            <h2 className="section-title">Questions? We've Got Answers.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner scroll-reveal">
            <div className="cta-text">
              <h2>Ready to turn your scrap into value?</h2>
              <p>Join thousands of businesses already trading smarter and greener on ScrapBazaar.</p>
            </div>
            <div className="cta-actions">
              <Link to="/auth/register?role=seller" className="btn btn-primary btn-xl">
                Start Selling <ArrowRight size={18} />
              </Link>
              <Link to="/auth/register?role=buyer" className="btn btn-ghost btn-xl cta-ghost-btn">
                Start Buying <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
