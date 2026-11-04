import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import {
  Upload, TrendingUp, ShieldCheck, FileCheck,
  Bell, BarChart3, CheckCircle2, ArrowRight,
  Factory, Award, Clock, Package, DollarSign
} from 'lucide-react'
import './InfoPage.css'

const SELLER_BENEFITS = [
  { icon: <TrendingUp  size={24} />, title: 'Maximum Price Guaranteed', desc: 'Live competitive bidding means multiple verified buyers compete for your scrap — you always get the best market rate.' },
  { icon: <ShieldCheck size={24} />, title: 'Verified Buyer Network', desc: 'Every buyer is KYC and business-verified before they can place a bid. No fraudulent or unqualified buyers.' },
  { icon: <DollarSign  size={24} />, title: 'Secure Payments', desc: 'Funds are confirmed and secured before pickup is coordinated. You never chase payments or deal with bounced cheques.' },
  { icon: <Upload      size={24} />, title: 'Easy Listing Process', desc: 'A four-step guided wizard makes it simple to upload material details, photos, quantity and auction settings.' },
  { icon: <FileCheck   size={24} />, title: 'Complete Documentation', desc: 'Auto-generated invoices, weighment slips and full transaction history stored digitally for compliance.' },
  { icon: <BarChart3   size={24} />, title: 'Sales Analytics', desc: 'Track your listings, bidding activity, revenue and material demand trends from your seller dashboard.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register & Get Verified', desc: 'Create your seller account and submit your business documents. Verification typically completes in 24–48 hours.' },
  { step: '02', title: 'Upload Your Scrap Material', desc: 'Use the guided four-step listing wizard: add material details, upload photos, set quantity and configure auction pricing.' },
  { step: '03', title: 'Your Listing Goes Live', desc: 'Once published, your listing is visible to all verified buyers on the platform. Buyers can start placing bids immediately.' },
  { step: '04', title: 'Receive Competitive Bids', desc: 'Watch bids roll in from multiple verified buyers in real-time. You can monitor bidding activity from your dashboard.' },
  { step: '05', title: 'Auction Closes Automatically', desc: 'The auction closes at your configured end time. The highest valid bid wins. You are notified immediately with the result.' },
  { step: '06', title: 'Complete the Transaction', desc: 'Coordinate pickup with the winning buyer. Confirm weighment and release payment through the platform.' },
]

export default function SellersPage() {
  return (
    <div className="info-page">
      <Navbar />

      {/* Hero */}
      <section className="info-hero sellers-hero">
        <div className="info-hero-overlay sellers-overlay" />
        <div className="container info-hero-content">
          <div className="info-hero-badge sellers-badge">
            <Factory size={14} /> For Scrap Sellers
          </div>
          <h1>Get the Best Price for Every Kilo.</h1>
          <p>Stop depending on a single local dealer. List your scrap on ScrapBazaar and let hundreds of verified buyers compete for your material.</p>
          <div className="info-hero-ctas">
            <Link to="/auth/register?role=seller" className="btn btn-primary btn-xl">
              Register as Seller <ArrowRight size={18} />
            </Link>
            <Link to="/auth/login?role=seller" className="btn btn-ghost btn-xl info-ghost-btn">
              Seller Login <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header">
            <div className="section-tag"><Award size={14} /> Why Sell on ScrapBazaar</div>
            <h2 className="section-title">Everything a Scrap Seller Needs</h2>
            <p className="section-subtitle">Built to maximize your scrap value while making the entire process simple, transparent and secure.</p>
          </div>
          <div className="grid-3">
            {SELLER_BENEFITS.map((b, i) => (
              <div key={i} className="info-card card">
                <div className="info-card-icon sellers-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad info-alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-tag sellers-tag"><Clock size={14} /> Step by Step</div>
            <h2 className="section-title">How Selling Works</h2>
            <p className="section-subtitle">From listing to payment — a clear and straightforward process for every seller.</p>
          </div>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="step-card sellers-step">
                <div className="step-card-number sellers-num">{s.step}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listing wizard preview */}
      <section className="section-pad">
        <div className="container">
          <div className="bidding-explain">
            <div className="bidding-text">
              <div className="section-tag sellers-tag" style={{ display: 'inline-flex', marginBottom: 16 }}>
                <Upload size={14} /> Material Upload Wizard
              </div>
              <h2>List Your Material in 4 Simple Steps</h2>
              <p>Our guided listing wizard takes the guesswork out of creating a professional material listing. Complete all four steps and your lot goes live to verified buyers instantly.</p>
              <ul className="bidding-points sellers-points">
                <li><CheckCircle2 size={16} /> <b>Step 1:</b> Material name, category, type, grade and description</li>
                <li><CheckCircle2 size={16} /> <b>Step 2:</b> Upload photos, set quantity, unit and warehouse location</li>
                <li><CheckCircle2 size={16} /> <b>Step 3:</b> Set starting price, minimum bid increment and auction dates</li>
                <li><CheckCircle2 size={16} /> <b>Step 4:</b> Review your complete listing and publish it live</li>
              </ul>
              <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Your confidential minimum acceptable price is never visible to buyers or included in any public response.
              </p>
            </div>
            <div className="wizard-preview">
              <div className="wizard-steps-bar">
                {['Material Info', 'Images & Stock', 'Pricing & Auction', 'Review & Publish'].map((label, i) => (
                  <div key={i} className={`wizard-step-dot ${i === 2 ? 'active-dot' : i < 2 ? 'done-dot' : ''}`}>
                    <div className="dot-circle">{i < 2 ? '✓' : i + 1}</div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="wizard-preview-card">
                <h4>Step 3: Pricing & Auction</h4>
                <div className="wizard-field"><label>Starting Price (₹/unit)</label><div className="wizard-input">28,000</div></div>
                <div className="wizard-field"><label>Min. Bid Increment (₹)</label><div className="wizard-input">500</div></div>
                <div className="wizard-field"><label>Auction End Date & Time</label><div className="wizard-input">Dec 15, 2026 — 5:00 PM</div></div>
                <div className="wizard-field confidential">
                  <label>🔒 Min. Acceptable Price <span>(confidential)</span></label>
                  <div className="wizard-input">••••••</div>
                </div>
                <p className="wizard-note">Your minimum acceptable price is never shown to buyers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bid privacy */}
      <section className="section-pad info-alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-tag sellers-tag"><ShieldCheck size={14} /> Bidder Privacy</div>
            <h2 className="section-title">Fair & Transparent Auction Rules</h2>
            <p className="section-subtitle">ScrapBazaar enforces strict auction rules to ensure fair competition and data privacy.</p>
          </div>
          <div className="grid-2" style={{ maxWidth: 800, margin: '0 auto' }}>
            {[
              { title: 'During Active Auctions', points: ['Buyer identities are anonymous — shown as Buyer 01, Buyer 02, etc.', 'Sellers can see bid amounts but not bidder details', 'All bids are validated server-side to prevent manipulation', 'Minimum increments are enforced automatically'] },
              { title: 'After Auction Closes', points: ['Winning buyer\'s business details are revealed to the seller', 'Full bid history is available for review', 'Both parties receive immediate notifications', 'Transaction details are available in both dashboards'] },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <h3 style={{ marginBottom: 16 }}>{s.title}</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.points.map((p, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, fontSize: '0.9rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="info-cta-section sellers-cta">
        <div className="container info-cta-inner">
          <div>
            <h2>Ready to Sell Smarter?</h2>
            <p>Join hundreds of verified sellers already maximizing their scrap value on ScrapBazaar.</p>
          </div>
          <div className="info-cta-actions">
            <Link to="/auth/register?role=seller" className="btn btn-primary btn-xl">
              Register as Seller <ArrowRight size={18} />
            </Link>
            <Link to="/auth/login?role=seller" className="btn btn-ghost btn-xl info-ghost-btn">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
