// src/config/siteConfig.js
/**
 * Public Store Configuration
 * 
 * CRITICAL WHITE-LABEL RULE:
 * This store sells sourced products under our own brand.
 * NEVER mention or display wholesale suppliers or internal source names anywhere.
 * 
 * Edit this file to rebrand the entire platform in 5 seconds.
 */

export const siteConfig = {
  // Brand details
  storeName: "DeshiMart BD",
  brandName: "DeshiMart BD",
  logoText: "DESHIMART",
  logoHighlight: "BD",
  tagline: "বাংলাদেশের সবচেয়ে বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম",
  announcement: "🚚 সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা | 📦 আজই অর্ডার করুন",
  
  // Helplines & Direct Contacts
  helpline: "019XXXXXXXX",
  displayHelpline: "019XX-XXXXXX",
  whatsappNumber: "88019XXXXXXXX",
  whatsappDisplay: "+880 19XX-XXXXXX",
  supportEmail: "support@deshimartbd.com",
  officeAddress: "বাড়ি ৪২, রোড ১১, বনানী, ঢাকা-১২১৩, বাংলাদেশ",
  
  // Currency & Formats
  currencySymbol: "৳",
  currencyCode: "BDT",
  
  // Shipping & Delivery Rates (in BDT as requested: ৳ 70 / ৳ 130)
  deliveryCharges: {
    insideDhaka: 70,
    outsideDhaka: 130,
    expressDhaka: 120,
  },
  freeDeliveryThreshold: 2500,
  estimatedDelivery: {
    insideDhaka: "১ থেকে ২ দিন (ঢাকার ভেতরে)",
    outsideDhaka: "২ থেকে ৪ দিন (ঢাকার বাইরে)",
  },
  
  // Social Proof Settings
  socialProof: {
    enabled: true,
    intervalMs: 25000, // Every 25 seconds
    durationMs: 4000,  // Stays for 4 seconds
  },
  
  // Trust Guarantees
  trustBadges: [
    {
      id: "cod",
      icon: "🛡️",
      title: "১০০% ক্যাশ অন ডেলিভারি",
      subtitle: "হাতে পণ্য পেয়ে মূল্য পরিশোধ করুন"
    },
    {
      id: "fast-delivery",
      icon: "🚚",
      title: "দ্রুত হোম ডেলিভারি",
      subtitle: "সারা বাংলাদেশে ঘরে বসে পণ্য পান"
    },
    {
      id: "easy-return",
      icon: "🔄",
      title: "৭ দিনে সহজ রিটার্ন",
      subtitle: "পণ্য পছন্দ না হলে তাৎক্ষণিক রিটার্ন"
    },
    {
      id: "genuine",
      icon: "💯",
      title: "অরিজিনাল পণ্য গ্যারান্টি",
      subtitle: "১০০% প্রিমিয়াম ও যাচাইকৃত কোয়ালিটি"
    }
  ],

  // Promotional Banner Content
  heroBanner: {
    badge: "🔥 মেগা ধামাকা অফার (MEGA DHAMAKA)",
    title: "ঈদের সেরা কালেকশনে সর্বোচ্চ ৫০% পর্যন্ত ছাড়!",
    subtitle: "ক্যাশ অন ডেলিভারি ও দ্রুততম হোম ডেলিভারি সহ সেরা কোয়ালিটির নিশ্চয়তা।",
    ctaText: "এখনই কিনুন (Shop Now)",
    ctaLink: "#flash-sale",
    highlightBadge: "🚚 সারাদেশে ফ্রি ডেলিভারি (৳২৫০০+ অর্ডারে)"
  },

  // Today's Deal Special Widget
  todaysDeal: {
    id: "deal-01",
    badge: "🔥 আজকের ডিল (TODAY'S DEAL)",
    title: "প্রিমিয়াম ওয়াটারপ্রুফ আল্ট্রা-লাইট ব্যাকপ্যাক",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    price: 650,
    originalPrice: 1080,
    discountPercent: 40,
    rating: 4.9,
    reviewsCount: 156,
    soldCount: 384,
    stockLeft: 18,
    category: "watches-accessories",
    categoryName: "ঘড়ি ও এক্সেসরিজ",
  },

  // Trust highlight card on hero right
  trustCard: {
    title: "✅ ১০০% বিশ্বস্ত ও নিরাপদ",
    tagline: "হাতে পেয়ে দেখে মূল্য পরিশোধ করুন",
    bullets: [
      "অর্ডারের পূর্বে কোনো অগ্রিম টাকা নেওয়া হয় না",
      "ডেলিভারিম্যানের সামনে চেক করে নেওয়ার সুবিধা",
      "সরাসরি হেল্পলাইনে সার্বক্ষণিক কাস্টমার কেয়ার"
    ]
  }
};
