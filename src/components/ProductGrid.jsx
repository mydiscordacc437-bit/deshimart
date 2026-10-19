// src/components/ProductGrid.jsx
import React, { useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ 
  products, 
  categories, 
  activeCategory, 
  onSelectCategory,
  onOrderProduct,
  onAddToCart,
  onQuickView,
  searchTerm 
}) {
  const [sortBy, setSortBy] = useState('popular');

  // Filter products by category and search
  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchTerm || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort
  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.reviewsCount || 0) - (a.reviewsCount || 0); // default popular
  });

  const activeCategoryObj = categories.find(c => c.id === activeCategory);

  return (
    <section id="product-catalog-section" className="catalog-section">
      <div className="container">
        
        {/* Section Header with Category Tabs */}
        <div className="catalog-header-wrap">
          <div className="catalog-title-box">
            <span className="catalog-pill-icon">{activeCategoryObj?.icon || '🛍️'}</span>
            <div>
              <h2 className="catalog-main-title">
                {activeCategory === 'all' ? 'আমাদের সকল পণ্য সম্ভার' : activeCategoryObj?.name}
              </h2>
              <p className="catalog-sub">
                {searchTerm ? `"${searchTerm}" এর জন্য ফলাফল` : '১০০% অরিজিনাল ও ক্যাশ অন ডেলিভারি সুবিধা'} ({sortedProducts.length} টি পণ্য)
              </p>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="catalog-sort-box">
            <label htmlFor="sort-select" className="sort-label">সাজান:</label>
            <select 
              id="sort-select" 
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">জনপ্রিয়তা (Popular)</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
              <option value="rating">রেটিং অনুযায়ী</option>
            </select>
          </div>
        </div>

        {/* Filter Pills for quick switching */}
        <div className="category-filter-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span className="pill-name">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="catalog-grid">
            {sortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOrderNow={onOrderProduct}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state">
            <span className="empty-icon">🔍</span>
            <h3>কোনো পণ্য পাওয়া যায়নি</h3>
            <p>আপনার অনুসন্ধান পরিবর্তন করে পুনরায় চেষ্টা করুন</p>
            <button 
              type="button" 
              className="btn-reset-filter"
              onClick={() => onSelectCategory('all')}
            >
              সব পণ্য দেখুন
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
