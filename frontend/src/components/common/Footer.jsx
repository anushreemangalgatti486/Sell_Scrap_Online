import React from 'react'
import { Link } from 'react-router-dom'
import { Recycle, Mail, Phone, MapPin, Linkedin, Twitter, Youtube } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-mark">SB</div>
              <span className="logo-name">ScrapBazaar</span>
            </Link>
            <p className="footer-tagline">
              India's verified B2B industrial scrap marketplace. Connecting businesses for
              transparent, competitive scrap trading.
            </p>
            <div className="footer-tag">
              <Recycle size={14} /> Recycle · Reuse · Rebuild
            </div>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="LinkedIn"><Linkedin size={16} /></a>
              <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={16} /></a>
              <a href="#" className="social-icon" aria-label="YouTube"><Youtube size={16} /></a>
            </div>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/buyers">For Buyers</Link></li>
              <li><Link to="/sellers">For Sellers</Link></li>
              <li><Link to="/auth/register">Get Started</Link></li>
            </ul>
          </div>

          {/* Materials */}
          <div className="footer-col">
            <h4>Materials</h4>
            <ul>
              <li><Link to="/buyers">Iron & Steel</Link></li>
              <li><Link to="/buyers">Copper</Link></li>
              <li><Link to="/buyers">Aluminium</Link></li>
              <li><Link to="/buyers">E-Waste</Link></li>
              <li><Link to="/buyers">Paper & Plastic</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <ul className="footer-contact">
              <li>
                <Mail size={14} />
                <a href="mailto:hello@scrapbazaar.in">hello@scrapbazaar.in</a>
              </li>
              <li>
                <Phone size={14} />
                <a href="tel:+918000000000">+91 80000 00000</a>
              </li>
              <li>
                <MapPin size={14} />
                <span>Bengaluru, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ScrapBazaar. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
