// src/components/TrackingModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ORDER_STEPS } from '../config/orderSteps';

export default function TrackingModal({ isOpen, onClose, orders = [] }) {
  const dialogRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-load latest order if available
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      if (orders.length > 0 && !hasSearched) {
        const latest = orders[0];
        setSearchQuery(latest.orderId);
        setMatchedOrder(latest);
        setHasSearched(true);
        setErrorMessage('');
      }
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen, orders]);

  // Keep matchedOrder synced with live orders if status changed in Admin!
  useEffect(() => {
    if (matchedOrder && orders.length > 0) {
      const liveUpdated = orders.find(o => o.orderId === matchedOrder.orderId);
      if (liveUpdated) {
        setMatchedOrder(liveUpdated);
      }
    }
  }, [orders]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    setHasSearched(true);
    setErrorMessage('');

    // Clean phone number or order ID match
    const cleanQuery = q.replace(/[^a-zA-Z0-9-]/g, '');

    const found = orders.find(o => {
      const matchId = o.orderId.toLowerCase().includes(cleanQuery) || cleanQuery.includes(o.orderId.toLowerCase());
      const matchPhone = o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, ''));
      return matchId || (cleanQuery.length >= 4 && matchPhone);
    });

    if (found) {
      setMatchedOrder(found);
    } else {
      setMatchedOrder(null);
      setErrorMessage(`"${searchQuery}" এর সাথে সম্পর্কিত কোনো অর্ডার পাওয়া যায়নি। সঠিক ১১ ডিজিটের মোবাইল নম্বর অথবা ইনভয়েস আইডি (যেমন: INV-2026-XXXX) দিয়ে চেষ্টা করুন।`);
    }
  };

  const currentStep = matchedOrder?.statusStep || 1;

  return (
    <dialog ref={dialogRef} className="tracking-dialog" onClose={onClose}>
      <div className="tracking-dialog-content">
        
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title-wrap">
            <span className="dialog-icon">📦</span>
            <div>
              <h3 className="dialog-title">অর্ডার ট্র্যাকিং সিস্টেম (Live Tracker)</h3>
              <p className="dialog-subtitle">
                আপনার ১১ ডিজিটের মোবাইল নম্বর অথবা অর্ডার আইডি লিখে বর্তমান কুরিয়ার অগ্রগতি জানুন
              </p>
            </div>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="বন্ধ করুন">
            ✕
          </button>
        </div>

        {/* Search Form */}
        <form className="track-form" onSubmit={handleTrackSubmit}>
          <div className="track-input-group">
            <input
              type="text"
              className="track-input"
              placeholder="মোবাইল নম্বর (01XXXXXXXXX) অথবা অর্ডার আইডি (INV-2026-XXXX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button type="submit" className="track-submit-btn">
              <span>ট্র্যাক করুন</span>
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="track-error-alert fade-in">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Matched Order Tracking View */}
        {hasSearched && matchedOrder && (
          <div className="tracking-results-card fade-in">
            
            {/* Top Details Banner */}
            <div className="track-details-banner">
              <div className="track-banner-left">
                <span className="track-banner-label">ইনভয়েস নম্বর:</span>
                <strong className="track-order-id num">{matchedOrder.orderId}</strong>
                <span className="track-date-time">{matchedOrder.date || 'আজ'} • {matchedOrder.time || '10:30 PM'}</span>
              </div>
              <div className="track-banner-right">
                <div className="courier-badge-box">
                  <span className="courier-partner-name">🚚 {matchedOrder.courier || 'Steadfast Courier'}</span>
                  <span className="consignment-no num">কন্সাইনমেন্ট: {matchedOrder.consignmentId || 'STF-849120'}</span>
                </div>
              </div>
            </div>

            {/* Visual 5-Step Courier Progress Stepper per specification */}
            <div className="courier-stepper-container">
              <h4 className="stepper-title">কুরিয়ার অগ্রগতি ট্র্যাকার (৫-ধাপ স্ট্যাটাস)</h4>
              
              <div className="five-step-stepper">
                {ORDER_STEPS.map((s, idx) => {
                  const isCompleted = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  const isPending = currentStep < s.step;

                  return (
                    <div 
                      key={s.step} 
                      className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                    >
                      <div className="node-marker">
                        {isCompleted ? '✓' : isCurrent ? s.icon : s.step}
                      </div>
                      
                      <div className="node-details">
                        <strong className="node-title">
                          ধাপ {s.step}: {s.label}
                        </strong>
                        <span className="node-status-text">
                          {isCompleted && 'সম্পন্ন হয়েছে'}
                          {isCurrent && 'চলমান অবস্থা (Active)'}
                          {isPending && 'আসন্ন'}
                        </span>
                      </div>

                      {idx < ORDER_STEPS.length - 1 && (
                        <div className={`node-connector ${isCompleted ? 'completed' : ''}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items & Customer Overview */}
            <div className="track-order-summary-box">
              <div className="track-items-col">
                <h5 className="col-sub-heading">অর্ডারের পণ্য:</h5>
                <div className="track-item-card">
                  {matchedOrder.product?.image && (
                    <img src={matchedOrder.product.image} alt={matchedOrder.product.title} className="track-thumb" />
                  )}
                  <div className="track-item-meta">
                    <strong className="item-name">{matchedOrder.product?.title || 'পণ্য'}</strong>
                    <div className="item-variants-row">
                      {matchedOrder.selectedSize && (
                        <span className="variant-tag">সাইজ: {matchedOrder.selectedSize}</span>
                      )}
                      {matchedOrder.selectedColor && (
                        <span className="variant-tag">কালার: {matchedOrder.selectedColor}</span>
                      )}
                      <span className="variant-tag num">পরিমাণ: {matchedOrder.quantity || 1} টি</span>
                    </div>
                    <span className="item-price num">{siteConfig.currencySymbol}{matchedOrder.product?.price} প্রতি পিস</span>
                  </div>
                </div>
              </div>

              <div className="track-delivery-col">
                <h5 className="col-sub-heading">গ্রাহক ও ডেলিভারি তথ্য:</h5>
                <div className="customer-info-box">
                  <p><strong>নাম:</strong> {matchedOrder.customerName}</p>
                  <p><strong>ফোন:</strong> <span className="num">{matchedOrder.customerPhone}</span></p>
                  <p><strong>ঠিকানা:</strong> {matchedOrder.customerAddress}</p>
                  <p><strong>ডেলিভারি এলাকা:</strong> {matchedOrder.deliveryArea}</p>
                  <div className="track-total-box">
                    <span>সর্বমোট ক্যাশ অন ডেলিভারি:</span>
                    <strong className="track-total num">{siteConfig.currencySymbol}{matchedOrder.grandTotal}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Actions */}
            <div className="tracking-support-actions">
              <a 
                href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${siteConfig.storeName},\nআমি আমার অর্ডার #${matchedOrder.orderId} এর বর্তমান অবস্থা জানতে যোগাযোগ করছি।`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-track-whatsapp"
              >
                <span>💬 হোয়াটসঅ্যাপে সহায়তা নিন</span>
              </a>
              <a href={`tel:${siteConfig.helpline}`} className="btn-track-call num">
                <span>📞 কল করুন {siteConfig.displayHelpline}</span>
              </a>
            </div>

          </div>
        )}

      </div>
    </dialog>
  );
}
