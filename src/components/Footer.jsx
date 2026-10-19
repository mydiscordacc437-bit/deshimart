// src/components/Footer.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function Footer({ onOpenTracking, onOpenAdmin }) {
  return (
    <footer className="main-footer">
      
      {/* Upper Footer: Guarantees & Features */}
      <div className="footer-top-strip">
        <div className="container">
          <div className="footer-top-grid">
            <div className="footer-perk">
              <span className="perk-icon">📞</span>
              <div>
                <strong>সার্বক্ষণিক কাস্টমার কেয়ার</strong>
                <p>সকাল ৯টা থেকে রাত ১১টা পর্যন্ত</p>
              </div>
            </div>
            <div className="footer-perk">
              <span className="perk-icon">🛡️</span>
              <div>
                <strong>১০০% ক্যাশ অন ডেলিভারি</strong>
                <p>পণ্য চেক করে টাকা দেওয়ার নিশ্চয়তা</p>
              </div>
            </div>
            <div className="footer-perk">
              <span className="perk-icon">🚚</span>
              <div>
                <strong>সারা বাংলাদেশে হোম ডেলিভারি</strong>
                <p>দ্রুত ও নিরাপদ ডেলিভারি সার্ভিস</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="footer-main">
        <div className="container footer-grid">
          
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="logo-icon-badge">🛒</span>
              <span className="logo-text">
                {siteConfig.logoText} <span className="logo-highlight">{siteConfig.logoHighlight}</span>
              </span>
            </div>
            <p className="footer-about">
              {siteConfig.storeName} - বাংলাদেশের অন্যতম শীর্ষস্থানীয় অনলাইন শপিং গন্তব্য। গ্রাহকদের সর্বোচ্চ সেবা ও অরিজিনাল পণ্য নিশ্চিত করাই আমাদের মূল লক্ষ্য।
            </p>
            <div className="footer-contact-info">
              <p>📍 {siteConfig.officeAddress}</p>
              <p>📞 হেল্পলাইন: <span className="num">{siteConfig.displayHelpline}</span></p>
              <p>💬 হোয়াটসঅ্যাপ: <span className="num">{siteConfig.whatsappDisplay}</span></p>
              <p>✉️ ইমেইল: {siteConfig.supportEmail}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-title">প্রয়োজনীয় লিংক</h4>
            <ul className="footer-links">
              <li><a href="#flash-sale-section">⚡ ফ্ল্যাশ সেল অফার</a></li>
              <li><a href="#product-catalog-section">🛍️ সকল পণ্য সম্ভার</a></li>
              <li><button type="button" className="footer-btn-link" onClick={onOpenTracking}>📦 অর্ডার ট্র্যাক করুন</button></li>
              <li><button type="button" className="footer-btn-link" onClick={onOpenAdmin}>🛠️ স্টোর এডমিন ড্যাশবোর্ড</button></li>
              <li><a href={`https://wa.me/${siteConfig.whatsappNumber}`} target="_blank" rel="noopener noreferrer">💬 সরাসরি হোয়াটসঅ্যাপ চ্যাট</a></li>
            </ul>
          </div>

          {/* Customer Service Policies */}
          <div className="footer-col">
            <h4 className="footer-title">গ্রাহক সেবা ও নীতি</h4>
            <ul className="footer-links">
              <li><a href="#terms">🛡️ ক্যাশ অন ডেলিভারি সুবিধা</a></li>
              <li><a href="#terms">🔄 ৭ দিনের রিটার্ন পলিসি</a></li>
              <li><a href="#terms">🚚 ডেলিভারি ও শিপিং চার্জ</a></li>
              <li><a href="#terms">🔒 নিরাপত্তা ও প্রাইভেসি পলিসি</a></li>
            </ul>
          </div>

          {/* Payment Badges & COD Assurance */}
          <div className="footer-col">
            <h4 className="footer-title">পেমেন্ট মেথড</h4>
            <div className="payment-badges-wrap">
              <span className="pay-badge cod-badge">💵 ক্যাশ অন ডেলিভারি</span>
              <span className="pay-badge">বিকাশ (bKash)</span>
              <span className="pay-badge">নগদ (Nagad)</span>
              <span className="pay-badge">রকেট (Rocket)</span>
            </div>
            <div className="verified-store-tag">
              <span>✅ ভেরিফাইড ই-কমার্স প্ল্যাটফর্ম</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p className="copyright-text">
            © {new Date().getFullYear()} {siteConfig.storeName}. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="footer-subtext">
            <span>ক্যাশ অন ডেলিভারিতে বাংলাদেশের নির্ভরযোগ্য শপিং প্ল্যাটফর্ম</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
