// src/components/TopBar.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function TopBar({ onOpenTracking, onOpenAdmin }) {
  return (
    <div className="top-bar">
      <div className="container top-bar-container">
        <div className="top-bar-left">
          <a href={`tel:${siteConfig.helpline}`} className="top-bar-item" title="সরাসরি কল করুন">
            <span className="icon">📞</span>
            <span className="label">হেল্পলাইন:</span>
            <strong className="num helpline-num">{siteConfig.displayHelpline}</strong>
          </a>
          <span className="top-bar-divider desktop-only">|</span>
          <span className="top-bar-item delivery-pill desktop-only">
            <span className="icon">🚚</span>
            <span>সারাদেশে ক্যাশ অন ডেলিভারি</span>
          </span>
        </div>

        <div className="top-bar-center marquee-text">
          <span className="badge-live">LIVE</span>
          <span>{siteConfig.announcement}</span>
        </div>

        <div className="top-bar-right">
          <button 
            type="button" 
            className="top-bar-btn track-btn"
            onClick={onOpenTracking}
            title="আপনার অর্ডার এর বর্তমান অবস্থা জানুন"
          >
            <span className="icon">📦</span>
            <span>অর্ডার ট্র্যাক করুন</span>
          </button>
          
          <span className="top-bar-divider desktop-only">|</span>
          
          <button 
            type="button" 
            className="top-bar-btn admin-btn"
            onClick={onOpenAdmin}
            title="স্টোর অর্ডার ম্যানেজার ও স্ট্যাটাস আপডেট"
          >
            <span className="icon">🛠️</span>
            <span>এডমিন প্যানেল</span>
          </button>

          <span className="top-bar-divider desktop-only">|</span>
          
          <a 
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent('হ্যালো ' + siteConfig.storeName + ', আমি কিছু তথ্য জানতে চাই।')}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="top-bar-item whatsapp-link desktop-only"
            title="সরাসরি হোয়াটসঅ্যাপে কথা বলুন"
          >
            <span className="icon">💬</span>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
