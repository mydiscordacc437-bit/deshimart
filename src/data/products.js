import bbazarProducts from './products.json';

// Curated handcrafted items for complete category coverage
const curatedProducts = [
  // 1. Handloom Cotton Punjabi (Wireframe Flash Sale item 1)
  {
    id: "fs-1",
    title: "হ্যান্ডলুম প্রিমিয়াম কটন পাঞ্জাবি - রয়েল ব্লু",
    category: "mens-fashion",
    categoryName: "ছেলেদের ফ্যাশন",
    price: 850,
    originalPrice: 1300,
    discountPercent: 35,
    rating: 4.8,
    reviewsCount: 120,
    image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["M (38)", "L (40)", "XL (42)", "XXL (44)"],
    colors: [
      { name: "Royal Blue (রয়েল ব্লু)", hex: "#1e3a8a" },
      { name: "Pure White (সাদা)", hex: "#f8fafc" },
      { name: "Maroon (মেরুন)", hex: "#881337" }
    ],
    isFlashSale: true,
    isPopular: true,
    inStock: true,
    stockLeft: 11,
    description: "১০০% প্রিমিয়াম সুতি হ্যান্ডলুম কটন ফ্যাব্রিক। আরামদায়ক, আধুনিক স্লিম ফিট কাটিং এবং নিখুঁত এমব্রয়ডারি বাটন প্লেট। ঈদ, জুমা ও দৈনন্দিন ব্যবহারের জন্য সেরা পছন্দ।",
    specs: [
      { key: "ফ্যাব্রিক উপাদান", value: "১০০% পিওর হ্যান্ডলুম কটন (সুতি)" },
      { key: "কলার ও বাটন", value: "ম্যান্ডারিন কলার ও মেটাল ফিনিশ স্টাইলিশ বাটন" },
      { key: "কাটিং স্টাইল", value: "মডার্ন স্লিম ফিট" },
      { key: "পকেট", value: "দুই পাশে ২টি গভীর সাইড পকেট" },
      { key: "কালার গ্যারান্টি", value: "১০০% ওয়াশ কালার ফাস্ট গ্যারান্টি" },
      { key: "উৎপাদন", value: "বাংলাদেশ (Made in Bangladesh)" }
    ],
    sizeChart: [
      { size: "M (38)", chest: '38" ইঞ্চি', length: '40" ইঞ্চি', shoulder: '17.5" ইঞ্চি' },
      { size: "L (40)", chest: '40" ইঞ্চি', length: '42" ইঞ্চি', shoulder: '18.5" ইঞ্চি' },
      { size: "XL (42)", chest: '42" ইঞ্চি', length: '44" ইঞ্চি', shoulder: '19.5" ইঞ্চি' },
      { size: "XXL (44)", chest: '44" ইঞ্চি', length: '45" ইঞ্চি', shoulder: '20.5" ইঞ্চি' }
    ],
    reviews: [
      {
        id: "rev-101",
        author: "Tanvir Ahmed",
        location: "ধানমন্ডি, ঢাকা",
        rating: 5,
        date: "৩ দিন আগে",
        verified: true,
        comment: "আলহামদুলিল্লাহ, ছবির মতোই হুবহু পাঞ্জাবি পেয়েছি। কাপড়টা অনেক নরম ও আরামদায়ক। কালারটা খুব সুন্দর।"
      },
      {
        id: "rev-102",
        author: "Mahmudul Hasan",
        location: "জিইসি, চট্টগ্রাম",
        rating: 5,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "ডেলিভারি খুব দ্রুত পেয়েছি। সাইজ পারফেক্ট হয়েছে। সেলাই ও বাটনের ফিনিশিং বেশ প্রিমিয়াম।"
      },
      {
        id: "rev-103",
        author: "Rakibul Islam",
        location: "উপশহর, সিলেট",
        rating: 5,
        date: "২ সপ্তাহ আগে",
        verified: true,
        comment: "দাম অনুযায়ী কোয়ালিটি অসাধারণ। ক্যাশ অন ডেলিভারিতে চেক করে নিয়েছি। ধন্যবাদ দেশিমার্ট বিডি।"
      },
      {
        id: "rev-104",
        author: "Nusrat Jahan",
        location: "উত্তরা, ঢাকা",
        rating: 4,
        date: "৩ সপ্তাহ আগে",
        verified: true,
        comment: "ভাইয়ের জন্য গিফট কিনেছিলাম, ওর সাইজে খুব সুন্দর মানিয়েছে। কালার ওয়াশ করার পরেও নষ্ট হয়নি।"
      }
    ]
  },

  // 2. Men's Classic Leather Loafers (Wireframe Flash Sale item 2 - with exactly 7 in stock)
  {
    id: "fs-2",
    title: "মেনস ক্লাসিক ফর্মাল লেদার লোফার সু (Premium Casual Loafer)",
    category: "shoes",
    categoryName: "জুতা ও স্যান্ডেল",
    price: 690,
    originalPrice: 920,
    discountPercent: 25,
    rating: 4.7,
    reviewsCount: 85,
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["39", "40", "41", "42", "43"],
    colors: [
      { name: "Black (কালো)", hex: "#111827" },
      { name: "Chocolate Brown (চকলেট ব্রাউন)", hex: "#5c3a21" },
      { name: "Navy Blue (নেভি ব্লু)", hex: "#1e3a8a" }
    ],
    isFlashSale: true,
    isPopular: true,
    inStock: true,
    stockLeft: 7, // Exactly 7 items as in prompt: 🔥 মাত্র ৭টি পণ্য স্টকে বাকি আছে!
    description: "উচ্চমানের সিন্থেটিক প্রিমিয়াম লেদার, নরম কুশন ইনসোল এবং অ্যান্টি-স্লিপ গ্রিপযুক্ত রাবার সোল। অফিস, পার্টি বা ক্যাজুয়াল ব্যবহারে দীর্ঘ সময় পায়ে রাখার জন্য চূড়ান্ত আরাম প্রদান করে।",
    specs: [
      { key: "আপার উপাদান", value: "উচ্চমানের প্রিমিয়াম গ্রেড ভেগান লেদার" },
      { key: "সোল উপাদান", value: "নন-স্লিপ টেকসই রাবার আউটসোল" },
      { key: "ইনসোল", value: "মেমোরি ফোম কুশন ইনসোল" },
      { key: "ক্লোজার টাইপ", value: "স্লিপ-অন (Slip-on Loafer)" },
      { key: "ওয়ারেন্টি", value: "১ মাসের সোল পেস্টিং গ্যারান্টি" },
      { key: "ব্যবহার উপযোগী", value: "ফর্মাল ও সেমি-ফর্মাল" }
    ],
    sizeChart: [
      { size: "39", length: "24.5 cm (সেন্টিমিটার)", foot: "ইনসোল মাপ ৯.৬ ইঞ্চি" },
      { size: "40", length: "25.0 cm (সেন্টিমিটার)", foot: "ইনসোল মাপ ৯.৮ ইঞ্চি" },
      { size: "41", length: "25.5 cm (সেন্টিমিটার)", foot: "ইনসোল মাপ ১০.০ ইঞ্চি" },
      { size: "42", length: "26.0 cm (সেন্টিমিটার)", foot: "ইনসোল মাপ ১০.২ ইঞ্চি" },
      { size: "43", length: "26.5 cm (সেন্টিমিটার)", foot: "ইনসোল মাপ ১০.৪ ইঞ্চি" }
    ],
    reviews: [
      {
        id: "rev-201",
        author: "Mahmudul Hasan",
        location: "বনানী, ঢাকা",
        rating: 5,
        date: "২ দিন আগে",
        verified: true,
        comment: "জুতাটা অনেক হালকা আর ফোম ইনসোল থাকার কারণে অনেক আরাম। সাইজ ৪১ একদম পারফেক্ট হয়েছে।"
      },
      {
        id: "rev-202",
        author: "Rakibul Islam",
        location: "ময়মনসিংহ সদর",
        rating: 5,
        date: "৫ দিন আগে",
        verified: true,
        comment: "দারুণ চকলেট ব্রাউন কালার! ছবিতে যেমন চমৎকার লাগছিল বাস্তবেও দেখতে একদম প্রিমিয়াম।"
      },
      {
        id: "rev-203",
        author: "Tanvir Ahmed",
        location: "খুলনা",
        rating: 4,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "৬৯০ টাকায় এই লেভেলের ফিনিশিং আশা করিনি। ২ দিনের মাথায় ডেলিভারি পেয়েছি।"
      },
      {
        id: "rev-204",
        author: "Farhana Akter",
        location: "মিরপুর, ঢাকা",
        rating: 5,
        date: "২ সপ্তাহ আগে",
        verified: true,
        comment: "স্বামীর জন্মদিনের জন্য কিনেছিলাম। ও পরে খুব খুশি হয়েছে। প্যাকেজিং ও ক্যাশ অন ডেলিভারি সার্ভিস দারুণ।"
      }
    ]
  },

  // 3. Smart Watch with Calling (Wireframe Flash Sale item 3)
  {
    id: "fs-3",
    title: "স্মার্ট ওয়াচ উইথ ব্লুটুথ কলিং ও ফুল টাচ এইচডি ডিসপ্লে",
    category: "watches-accessories",
    categoryName: "ঘড়ি ও এক্সেসরিজ",
    price: 1150,
    originalPrice: 1900,
    discountPercent: 40,
    rating: 4.9,
    reviewsCount: 210,
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["1.85\" HD Display", "2.0\" AMOLED Curve"],
    colors: [
      { name: "Space Black (স্পেস ব্ল্যাক)", hex: "#0f172a" },
      { name: "Silver Metal (সিলভার মেটাল)", hex: "#94a3b8" },
      { name: "Rose Gold (রোজ গোল্ড)", hex: "#fb7185" }
    ],
    isFlashSale: true,
    isPopular: true,
    inStock: true,
    stockLeft: 15,
    description: "১.৮৫ ইঞ্চি ক্রিস্টাল ক্লিয়ার এইচডি টাচ স্ক্রিন, সরাসরি ব্লুটুথ কল রিসিভ ও ডায়ালিং সুবিধা, ২৪ ঘণ্টা হার্ট রেট ও স্লিপ মনিটরিং, ১০০+ স্পোর্টস মোড এবং আইপি৬৮ ওয়াটারপ্রুফ রেটিং।",
    specs: [
      { key: "ডিসপ্লে", value: "১.৮৫ ইঞ্চি ফুল টাচ সুপার ব্রাইট স্ক্রিন" },
      { key: "কলিং ফিচার", value: "এইচডি স্পিকার ও নয়েজ ক্যান্সেলিং মাইক" },
      { key: "ব্যাটারি ব্যাকআপ", value: "৫-৭ দিন নরমাল ইউজ, ১৫ দিন স্ট্যান্ডবাই" },
      { key: "সেন্সর", value: "SpO2 অক্সিজেন, হার্টবিট, পেডোমিটার, স্লিপ ট্র্যাকার" },
      { key: "কানেক্টিভিটি", value: "Android ও iOS উভয় ফোনেই সাপোর্ট" },
      { key: "ওয়ারেন্টি", value: "৬ মাসের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি" }
    ],
    sizeChart: [
      { size: "ডায়াল সাইজ", length: "44mm x 38mm", strap: "22mm সিলিকন স্ট্র্যাপ (চেঞ্জেবল)" },
      { size: "ওজন", length: "মাত্র ৪২ গ্রাম", strap: "হাতে পরলে অত্যন্ত আরামদায়ক" }
    ],
    reviews: [
      {
        id: "rev-301",
        author: "Tanvir Ahmed",
        location: "গুলশান, ঢাকা",
        rating: 5,
        date: "১ দিন আগে",
        verified: true,
        comment: "কলিং সাউন্ড কোয়ালিটি অনেক স্পষ্ট। ব্যাটারি ব্যাকআপ প্রায় ১ সপ্তাহ যাচ্ছে। একদম নিখুঁত ঘড়ি।"
      },
      {
        id: "rev-302",
        author: "Nusrat Jahan",
        location: "রাজশাহী",
        rating: 5,
        date: "৪ দিন আগে",
        verified: true,
        comment: "রোজ গোল্ড কালারটা নিয়েছি, দেখতে অসাধারণ লাগে। নোটিফিকেশন বাংলাতেও খুব সুন্দরভাবে আসে।"
      },
      {
        id: "rev-303",
        author: "Mahmudul Hasan",
        location: "যাত্রাবাড়ী, ঢাকা",
        rating: 5,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "এই দামে ব্লুটুথ কলিং ও সুন্দর ডিসপ্লে পাওয়া সত্যি অবিশ্বাস্য। ১০০% রিকমেন্ডেড।"
      }
    ]
  },

  // 4. AirPods Pro Wireless Earbuds (Wireframe Flash Sale item 4)
  {
    id: "fs-4",
    title: "এয়ারপডস প্রো ট্রু ওয়্যারলেস স্টেরিও ব্লুটুথ ইয়ারবাডস",
    category: "gadgets",
    categoryName: "গ্যাজেট ও ইলেকট্রনিক্স",
    price: 450,
    originalPrice: 560,
    discountPercent: 20,
    rating: 4.6,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["Standard Fit", "Extra Bass Edition"],
    colors: [
      { name: "Glossy White (সাদা)", hex: "#f8fafc" },
      { name: "Matte Black (ম্যাট ব্ল্যাক)", hex: "#1e293b" }
    ],
    isFlashSale: true,
    isPopular: false,
    inStock: true,
    stockLeft: 23,
    description: "ডিপ বেস সাউন্ড কোয়ালিটি, স্মার্ট টাচ সেন্সর, চার্জিং কেস সহ ২৪ ঘণ্টার নন-স্টপ মিউজিক ব্যাকআপ এবং ইনস্ট্যান্ট পেয়ারিং ফিচার।",
    specs: [
      { key: "ব্লুটুথ সংস্করণ", value: "Bluetooth v5.3 + EDR" },
      { key: "মিউজিক প্লে-টাইম", value: "প্রতি চার্জে ৪-৫ ঘণ্টা" },
      { key: "কেস ব্যাকআপ", value: "মোট ২৪ ঘণ্টা ব্যাকআপ (৪ বার চার্জ)" },
      { key: "চার্জিং পোর্ট", value: "টাইপ-সি ফাস্ট চার্জিং" }
    ],
    sizeChart: [
      { size: "ওজন", length: "প্রতি ইয়ারবাড মাত্র ৩.৮ গ্রাম", fit: "নরম সিলিকন ইয়ারটিপস ৩ সাইজ সহ" }
    ],
    reviews: [
      {
        id: "rev-401",
        author: "Rakibul Islam",
        location: "কুষ্টিয়া",
        rating: 5,
        date: "৩ দিন আগে",
        verified: true,
        comment: "বেস সাউন্ড খুব পাওয়ারফুল। গানের কথা এবং কল স্পষ্ট শোনা যায়। এই দামে সেরা।"
      },
      {
        id: "rev-402",
        author: "Mahmudul Hasan",
        location: "কুমিল্লা",
        rating: 4,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "চার্জ ভালো থাকে। চার্জিং কেসটা বেশ পকেট-ফ্রেন্ডলি।"
      }
    ]
  },

  // 5. Today's Deal Special: Waterproof Backpack
  {
    id: "deal-01",
    title: "প্রিমিয়াম ওয়াটারপ্রুফ আল্ট্রা-লাইট ব্যাকপ্যাক",
    category: "watches-accessories",
    categoryName: "ঘড়ি ও এক্সেসরিজ",
    price: 650,
    originalPrice: 1080,
    discountPercent: 40,
    rating: 4.9,
    reviewsCount: 156,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["25 Litre (Standard)", "35 Litre (Travel)"],
    colors: [
      { name: "Charcoal Grey (চারকোল গ্রে)", hex: "#334155" },
      { name: "Navy Blue (নেভি ব্লু)", hex: "#1e3a8a" },
      { name: "Stealth Black (কালো)", hex: "#0f172a" }
    ],
    isFlashSale: false,
    isPopular: true,
    inStock: true,
    stockLeft: 18,
    description: "রেইনপ্রুফ নাইলন ফ্যাব্রিক, ১৫.৬ ইঞ্চি ল্যাপটপ স্লট, অ্যান্টি-থেফট গোপন পকেট এবং শ্বাস-প্রশ্বাস উপযোগী এয়ারমেশ ব্যাক প্যাডিং।",
    specs: [
      { key: "উপাদান", value: "ওয়াটার-রেপেলেন্ট ডেনসিফাইড নাইলন" },
      { key: "ল্যাপটপ চেম্বার", value: "১৫.৬ ইঞ্চি পর্যন্ত সুরক্ষিত প্যাডেড কম্পার্টমেন্ট" },
      { key: "জিপার", value: "স্মুথ ও টেকসই হেভি-ডিউটি মেটাল জিপার" },
      { key: "ওজন", value: "মাত্র ৪৮০ গ্রাম" }
    ],
    sizeChart: [
      { size: "25L সাইজ", height: '18" ইঞ্চি', width: '12" ইঞ্চি', depth: '6" ইঞ্চি' }
    ],
    reviews: [
      {
        id: "rev-501",
        author: "Tanvir Ahmed",
        location: "মিরপুর ১০, ঢাকা",
        rating: 5,
        date: "২ দিন আগে",
        verified: true,
        comment: "বৃষ্টির দিনে ল্যাপটপ নিয়ে বের হওয়া নিয়ে আর কোনো চিন্তা নেই! পানি একদমই ঢোকে না।"
      },
      {
        id: "rev-502",
        author: "Farhana Akter",
        location: "বগুড়া",
        rating: 5,
        date: "৪ দিন আগে",
        verified: true,
        comment: "বিশ্ববিদ্যালয়ের জন্য পারফেক্ট সাইজ। ভেতরে অনেক পকেট আছে খাতা কলম রাখার জন্য।"
      }
    ]
  },

  // 6. Premium Katan Silk Saree
  {
    id: "wf-1",
    title: "প্রিমিয়াম কাতান সিল্ক শাড়ি উইথ ব্লাউজ পিস",
    category: "womens-fashion",
    categoryName: "মেয়েদের ফ্যাশন",
    price: 1450,
    originalPrice: 2200,
    discountPercent: 34,
    rating: 4.9,
    reviewsCount: 142,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["১২ হাত (স্ট্যান্ডার্ড)"],
    colors: [
      { name: "Royal Maroon (রয়েল মেরুন)", hex: "#831843" },
      { name: "Emerald Green (পান্না সবুজ)", hex: "#065f46" },
      { name: "Golden Mustard (সোনালি)", hex: "#b45309" }
    ],
    isFlashSale: false,
    isPopular: true,
    inStock: true,
    stockLeft: 8,
    description: "ঐতিহ্যবাহী বেনারসি কাতান মোটিফ, সোনালি জরি সুতার নিখুঁত অল-ওভার কাজ এবং নরম সফট সিল্ক টেক্সচার।",
    specs: [
      { key: "ফ্যাব্রিক", value: "সফট পিওর কাতান সিল্ক" },
      { key: "আঁচল", value: "হেভি জরি সুতার মিনাকারি নকশা" },
      { key: "ব্লাউজ পিস", value: "ম্যাচিং ১ গজ আনস্টিচড ব্লাউজ পিস সংযুক্ত" }
    ],
    sizeChart: [
      { size: "১২ হাত শাড়ি", length: "৬.৫ মিটার (ব্লাউজ পিস সহ)" }
    ],
    reviews: [
      {
        id: "rev-601",
        author: "Nusrat Jahan",
        location: "ধানমন্ডি, ঢাকা",
        rating: 5,
        date: "৩ দিন আগে",
        verified: true,
        comment: "শাড়িটা হাতে পেয়ে সত্যি মুগ্ধ হয়েছি! কাপড়ের গ্লেজ অসাধারণ আর একদম হালকা।"
      },
      {
        id: "rev-602",
        author: "Farhana Akter",
        location: "সিলেট সদর",
        rating: 5,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "মায়ের জন্মদিনে দিয়েছিলাম, মা অনেক খুশি হয়েছেন। রঙ একদম পাকা।"
      }
    ]
  },

  // 7. Women's Georgette Three Piece
  {
    id: "wf-2",
    title: "জর্জেট থ্রি-পিস এমব্রয়ডারি পার্টি ড্রেস",
    category: "womens-fashion",
    categoryName: "মেয়েদের ফ্যাশন",
    price: 1250,
    originalPrice: 1750,
    discountPercent: 28,
    rating: 4.8,
    reviewsCount: 96,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["M (38)", "L (40)", "XL (42)", "Free Size (Unstitched)"],
    colors: [
      { name: "Peach Pink (পিচ গোলাপি)", hex: "#f472b6" },
      { name: "Sky Blue (আকাশি)", hex: "#38bdf8" }
    ],
    isFlashSale: false,
    isPopular: true,
    inStock: true,
    stockLeft: 12,
    description: "প্রিমিয়াম সফট বাটারফ্লাই জর্জেট, সুতার নিখুঁত এমব্রয়ডারি গলার কাজ এবং বিশাল ম্যাচিং ওড়না।",
    specs: [
      { key: "জামা", value: "পিওর সফট জর্জেট সাথে আরামদায়ক ইনার সংযুক্ত" },
      { key: "ওড়না", value: "৫ হাত লম্বা চওড়া নামাজি ওড়না" },
      { key: "প্যান্ট", value: "সফট বাটার সিল্ক ফেব্রিক" }
    ],
    sizeChart: [
      { size: "লং", length: '46" ইঞ্চি' },
      { size: "বডি", length: 'Free Size (Up to 46")' }
    ],
    reviews: [
      {
        id: "rev-701",
        author: "Farhana Akter",
        location: "চট্টগ্রাম",
        rating: 5,
        date: "৫ দিন আগে",
        verified: true,
        comment: "অসাধারণ কাটিং ও কাজের ফিনিশিং। ছবির থেকেও সামনাসামনি দেখতে বেশি সুন্দর।"
      }
    ]
  },

  // 8. Men's Casual Linen Shirt
  {
    id: "mf-2",
    title: "মেনস ক্যাজুয়াল সলিড কালার লিনেন শার্ট",
    category: "mens-fashion",
    categoryName: "ছেলেদের ফ্যাশন",
    price: 590,
    originalPrice: 850,
    discountPercent: 30,
    rating: 4.7,
    reviewsCount: 67,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["M (38)", "L (40)", "XL (42)"],
    colors: [
      { name: "Olive Green (জলপাই)", hex: "#3f6212" },
      { name: "Classic Navy (নেভি)", hex: "#1e3a8a" },
      { name: "White (সাদা)", hex: "#f8fafc" }
    ],
    isFlashSale: false,
    isPopular: false,
    inStock: true,
    stockLeft: 18,
    description: "১০০% প্রিমিয়াম সুতি লিনেন ফ্যাব্রিক। গরমের দিনে পরার জন্য সর্বোচ্চ বাতাস চলাচল ও শীতল অনুভূতি দেয়।",
    specs: [
      { key: "কাপড়", value: "১০০% অরগানিক কটন লিনেন" },
      { key: "ফিটিং", value: "রেগুলার স্লিম ফিট" }
    ],
    sizeChart: [
      { size: "M (38)", chest: '38" ইঞ্চি', length: '28" ইঞ্চি' },
      { size: "L (40)", chest: '40" ইঞ্চি', length: '29" ইঞ্চি' },
      { size: "XL (42)", chest: '42" ইঞ্চি', length: '30" ইঞ্চি' }
    ],
    reviews: [
      {
        id: "rev-801",
        author: "Rakibul Islam",
        location: "ময়মনসিংহ",
        rating: 5,
        date: "১ সপ্তাহ আগে",
        verified: true,
        comment: "লিনেন কাপড়টা অনেক হালকা ও সফট। গরমের জন্য একদম আইডিয়াল শার্ট।"
      }
    ]
  },

  // 9. Ultra-Light Running Sneakers
  {
    id: "sh-2",
    title: "আল্ট্রা-লাইট ব্রিদেবল রানিং স্নিকার্স সু",
    category: "shoes",
    categoryName: "জুতা ও স্যান্ডেল",
    price: 890,
    originalPrice: 1250,
    discountPercent: 28,
    rating: 4.9,
    reviewsCount: 178,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    colors: [
      { name: "Crimson Red (লাল)", hex: "#dc2626" },
      { name: "Carbon Black (কালো)", hex: "#111827" }
    ],
    isFlashSale: false,
    isPopular: true,
    inStock: true,
    stockLeft: 14,
    description: "এয়ার-কুশনড ইভা মেমোরি আউটসোল ও মেশ ব্রিদেবল ফ্যাব্রিক। দৌড়ানো, হাঁটা বা জিমের জন্য আরামদায়ক ফিট।",
    specs: [
      { key: "আপার", value: "ফ্লাইনিট ব্রিদেবল মেশ" },
      { key: "সোল", value: "শক-অ্যাবজর্বিং ইভা কুশন" }
    ],
    sizeChart: [
      { size: "40", length: "25.0 cm" },
      { size: "41", length: "25.5 cm" },
      { size: "42", length: "26.0 cm" }
    ],
    reviews: [
      {
        id: "rev-901",
        author: "Mahmudul Hasan",
        location: "ঢাকা",
        rating: 5,
        date: "২ দিন আগে",
        verified: true,
        comment: "প্রতিদিন সকালে জগিং করি, পায়ে কোনো ব্যথা লাগে না। অনেক হালকা।"
      }
    ]
  },

  // 10. High-Speed Electric Blender
  {
    id: "hk-1",
    title: "মাল্টি-ফাংশনাল হাই-স্পিড ইলেকট্রিক ব্লেন্ডার ও জুসার",
    category: "home-kitchen",
    categoryName: "হোম ও কিচেন",
    price: 1350,
    originalPrice: 1950,
    discountPercent: 30,
    rating: 4.9,
    reviewsCount: 135,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    ],
    sizes: ["3-in-1 Jar Set", "4-in-1 Master Set"],
    colors: [
      { name: "Silver Inox (সিলভার)", hex: "#94a3b8" },
      { name: "Piano Black (কালো)", hex: "#111827" }
    ],
    isFlashSale: false,
    isPopular: true,
    inStock: true,
    stockLeft: 11,
    description: "১০০০ ওয়াট ১০০% কপার মোটর, ৩টি স্টেইনলেস স্টিল জার, মসলা গুঁড়ো ও ফলের জুস তৈরির জন্য নিখুঁত কিচেন সমাধান।",
    specs: [
      { key: "মোটর ক্ষমতা", value: "১০০০W হাই স্পিড পিওর কপার" },
      { key: "জার সংখ্যা", value: "৩টি আনব্রেকেবল স্টেইনলেস স্টিল জার" },
      { key: "ব্লেড", value: "লেজার কাট ৬-উইং স্টেইনলেস স্টিল ব্লেড" },
      { key: "ওয়ারেন্টি", value: "১ বছরের ফ্রি সার্ভিস ওয়ারেন্টি" }
    ],
    sizeChart: [
      { size: "ওয়েট জার", capacity: "১.৫ লিটার" },
      { size: "ড্রাই জার", capacity: "১.০ লিটার" },
      { size: "চাটনি জার", capacity: "০.৪ লিটার" }
    ],
    reviews: [
      {
        id: "rev-1001",
        author: "Nusrat Jahan",
        location: "মিরপুর, ঢাকা",
        rating: 5,
        date: "১ দিন আগে",
        verified: true,
        comment: "হলুদ ও শুকনা মরিচ মাত্র ৩০ সেকেন্ডে একদম গুঁড়ো হয়ে গেছে! মোটরটা অনেক শক্তিশালী।"
      }
    ]
  }
];

const slugMap = {
  'fs-1': 'handloom-cotton-punjabi-royal-blue-bbz101',
  'fs-2': 'mens-classic-formal-leather-loafer-bbz102',
  'fs-3': 'smart-watch-bluetooth-calling-hd-display-bbz103',
  'fs-4': 'airpods-pro-wireless-earbuds-bbz104',
  'deal-01': 'waterproof-ultra-light-backpack-bbz105',
  'wf-1': 'katan-silk-saree-with-blouse-piece-bbz106',
  'wf-2': 'georgette-three-piece-party-dress-bbz107',
  'mf-2': 'mens-casual-linen-shirt-bbz108',
  'sh-2': 'ultra-light-running-sneakers-bbz109',
  'hk-1': 'electric-blender-juicer-bbz110'
};

// Ensure all curated products have required e-commerce and B-Bazar schema fields
const enrichedCuratedProducts = curatedProducts.map(cp => {
  const numId = cp.id.replace(/[^0-9]/g, '') || '101';
  return {
    ...cp,
    slug: slugMap[cp.id] || `${cp.id}-bangladesh`,
    bbazarId: cp.bbazarId || Number(numId) + 10000,
    sku: cp.sku || `BBZ-${cp.id.toUpperCase()}`,
    sourceUrl: cp.sourceUrl || `https://bbazar.com.bd/product/${cp.id}`,
    basePrice: cp.price,
    sellingPrice: cp.price,
    wholesalePrice: cp.wholesalePrice || Math.round(cp.price * 0.78),
  };
});

// Merged catalog with synced B-Bazar live items + curated complete category items
export const products = [
  ...bbazarProducts,
  ...enrichedCuratedProducts
];

export const getProductBySlug = (slug) => {
  if (!slug) return products[0];
  const clean = slug.toLowerCase().trim();
  return products.find(p => p.slug?.toLowerCase() === clean || p.id === clean) || products[0];
};

export const getProductById = (id) => {
  if (!id) return products[0];
  return products.find(p => p.id === id || p.slug === id) || products[0];
};

// Dynamic Category Counts based on real combined catalog
export const categories = [
  { id: "all", name: "সব পণ্য (All)", icon: "🏷️", count: products.length },
  { id: "gadgets", name: "গ্যাজেট ও ইলেকট্রনিক্স", icon: "🎧", count: products.filter(p => p.category === 'gadgets').length },
  { id: "watches-accessories", name: "ঘড়ি ও এক্সেসরিজ", icon: "⌚", count: products.filter(p => p.category === 'watches-accessories').length },
  { id: "home-kitchen", name: "হোম ও কিচেন", icon: "🏠", count: products.filter(p => p.category === 'home-kitchen').length },
  { id: "mens-fashion", name: "ছেলেদের ফ্যাশন", icon: "👕", count: products.filter(p => p.category === 'mens-fashion').length },
  { id: "womens-fashion", name: "মেয়েদের ফ্যাশন", icon: "👗", count: products.filter(p => p.category === 'womens-fashion').length },
  { id: "shoes", name: "জুতা ও স্যান্ডেল", icon: "👞", count: products.filter(p => p.category === 'shoes').length },
];

// Authentic Bangladeshi Social Proof data
export const recentPurchaseNotifications = [
  { city: "ময়মনসিংহ", customer: "রাকিবুল ইসলাম", product: "Premium Casual Loafer" },
  { city: "ধানমন্ডি, ঢাকা", customer: "তানভীর আহমেদ", product: "হ্যান্ডলুম কটন পাঞ্জাবি" },
  { city: "জিইসি, চট্টগ্রাম", customer: "মাহমুদুল হাসান", product: "স্মার্ট ওয়াচ উইথ কলিং" },
  { city: "উপশহর, সিলেট", customer: "নুসরাত জাহান", product: "কাতান সিল্ক শাড়ি" },
  { city: "উত্তরা, ঢাকা", customer: "ফারহানা আক্তার", product: "জর্জেট থ্রি-পিস" },
  { city: "বোয়ালিয়া, রাজশাহী", customer: "সাকিব আল হাসান", product: "আল্ট্রা-লাইট রানিং স্নিকার্স" },
  { city: "খুলনা সদর", customer: "ইমরান হোসেন", product: "ওয়াটারপ্রুফ আল্ট্রা-লাইট ব্যাকপ্যাক" },
  { city: "কান্দিরপাড়, কুমিল্লা", customer: "আরিফুল ইসলাম", product: "এয়ারপডস প্রো ট্রু ওয়্যারলেস" },
  { city: "জাহাজ কোম্পানি মোড়, রংপুর", customer: "মেহেদী হাসান", product: "মাল্টি-ফাংশনাল ব্লেন্ডার" }
];
