// src/components/TrustBadges.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function TrustBadges() {
  return (
    <section className="trust-strip-section" aria-label="নিরাপত্তা ও ডেলিভারি প্রতিশ্রুতি">
      <div className="container">
        <div className="trust-strip-grid">
          {siteConfig.trustBadges.map((item) => (
            <div key={item.id} className="trust-strip-card">
              <div className="trust-icon-box">
                <span className="trust-emoji">{item.icon}</span>
              </div>
              <div className="trust-text-box">
                <h4 className="trust-heading">{item.title}</h4>
                <p className="trust-sub">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
