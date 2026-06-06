export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoLandingPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  sections: {
    title: string;
    body: string;
  }[];
  faqs: SeoFaq[];
  keywords: string[];
};

export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  sections: {
    title: string;
    body: string;
  }[];
  faqs: SeoFaq[];
};

export const localSeoPages: SeoLandingPage[] = [
  {
    slug: "chocolate-covered-strawberries-killeen",
    title: "Chocolate Covered Strawberries in Killeen TX",
    metaTitle: "Chocolate Covered Strawberries Killeen TX | L&A Amor & Sugar",
    metaDescription:
      "Order luxury chocolate covered strawberries in Killeen TX from L&A Amor & Sugar. Gift-ready berry boxes for birthdays, teachers, anniversaries, Fort Hood, and Central Texas celebrations.",
    eyebrow: "Killeen favorite",
    heroTitle: "Luxury chocolate covered strawberries made to impress in Killeen, TX",
    heroDescription:
      "Our signature dipped strawberries are styled like a premium gift: elegant colors, luxe drizzle, soft packaging, and handcrafted details for birthdays, romantic gifts, teacher appreciation, graduations, and just-because moments.",
    primaryCtaLabel: "Order Strawberries",
    primaryCtaHref: "/shop?q=strawberries",
    secondaryCtaLabel: "Start Custom Order",
    secondaryCtaHref: "/custom-orders",
    sections: [
      {
        title: "Gift-ready berries for real reactions",
        body:
          "Chocolate covered strawberries are one of the easiest ways to make a moment feel special. L&A Amor & Sugar creates luxury berry boxes for Killeen, Fort Hood, Harker Heights, Belton, Temple, and nearby Central Texas customers who want something more personal than flowers."
      },
      {
        title: "Pickup and local delivery",
        body:
          "Choose pickup or local delivery when available. Orders are handcrafted, so we recommend reserving your date early, especially around holidays, graduations, teacher appreciation week, and weekend events."
      }
    ],
    faqs: [
      {
        question: "Do you offer chocolate covered strawberry delivery in Killeen TX?",
        answer:
          "Local delivery may be available for Killeen and nearby Central Texas areas depending on the order date, distance, and availability."
      },
      {
        question: "How much notice do strawberry boxes need?",
        answer:
          "Two to three days notice is recommended because each order is made fresh and styled by hand."
      },
      {
        question: "Can I customize colors or themes?",
        answer:
          "Yes. Custom colors, drizzle, packaging, notes, and event themes can be requested through the custom order flow."
      }
    ],
    keywords: ["chocolate covered strawberries Killeen TX", "dessert gifts near me", "Fort Hood dessert gifts"]
  },
  {
    slug: "dessert-delivery-killeen",
    title: "Dessert Delivery in Killeen TX",
    metaTitle: "Dessert Delivery Killeen TX | Luxury Dessert Gifts",
    metaDescription:
      "Luxury dessert delivery and pickup in Killeen TX for chocolate covered strawberries, treat boxes, cake pops, Oreos, edible gifts, and custom dessert orders.",
    eyebrow: "Local delivery",
    heroTitle: "Luxury dessert delivery for Killeen celebrations",
    heroDescription:
      "Send a sweet gift that feels personal, polished, and unforgettable. We create dessert boxes, dipped strawberries, cake pops, Oreos, and custom treats for Killeen, Fort Hood, Harker Heights, Belton, Temple, and Central Texas.",
    primaryCtaLabel: "Order Now",
    primaryCtaHref: "/shop",
    secondaryCtaLabel: "View Menu",
    secondaryCtaHref: "/menu",
    sections: [
      {
        title: "Dessert gifts for birthdays, offices, teachers, and events",
        body:
          "From small surprise boxes to custom event sweets, our local dessert delivery options help you send something thoughtful without settling for a generic gift."
      },
      {
        title: "Handcrafted availability",
        body:
          "Because every order is made by hand, delivery availability is limited. Early reservations help secure your preferred pickup or delivery window."
      }
    ],
    faqs: [
      {
        question: "Where do you deliver?",
        answer:
          "Delivery availability depends on schedule and location, with Killeen and nearby Central Texas areas prioritized."
      },
      {
        question: "Can I send dessert as a gift?",
        answer:
          "Yes. Add notes, colors, themes, and packaging details during checkout or custom order request."
      }
    ],
    keywords: ["dessert delivery Killeen", "dessert gifts Killeen", "edible arrangements Killeen"]
  },
  {
    slug: "custom-cake-pops-killeen",
    title: "Custom Cake Pops in Killeen TX",
    metaTitle: "Custom Cake Pops Killeen TX | Luxury Designer Pops",
    metaDescription:
      "Order custom cake pops in Killeen TX for birthdays, graduations, school events, baby showers, offices, and luxury dessert gifts.",
    eyebrow: "Designer treats",
    heroTitle: "Custom cake pops for polished Killeen events",
    heroDescription:
      "From blush and gold birthday sets to graduation, teacher appreciation, baby shower, office, and branded event treats, our cake pops are designed to look beautiful on the table and feel gift-ready in the box.",
    primaryCtaLabel: "Design Your Treat",
    primaryCtaHref: "/treat-designer",
    secondaryCtaLabel: "Custom Order",
    secondaryCtaHref: "/custom-orders",
    sections: [
      {
        title: "Made for themes, colors, and custom moments",
        body:
          "Choose colors, drizzle, sprinkles, packaging notes, and custom details through the Treat Designer or custom order form."
      },
      {
        title: "Perfect for Central Texas celebrations",
        body:
          "Custom cake pops work beautifully for Killeen birthdays, Fort Hood celebrations, school gifts, graduation parties, and dessert tables across Central Texas."
      }
    ],
    faqs: [
      {
        question: "Can cake pops match my event colors?",
        answer:
          "Yes. Use the Treat Designer or custom order page to request colors, drizzle, sprinkles, theme, and packaging."
      },
      {
        question: "Do you make cake pops for large events?",
        answer:
          "Yes, availability depends on date, quantity, and design complexity. Early requests are recommended."
      }
    ],
    keywords: ["custom cake pops Killeen", "cake pops near Fort Hood", "graduation treats"]
  },
  {
    slug: "teacher-appreciation-gifts",
    title: "Teacher Appreciation Dessert Gifts",
    metaTitle: "Teacher Appreciation Gifts Killeen TX | Dessert Gift Boxes",
    metaDescription:
      "Shop teacher appreciation dessert gifts in Killeen TX including apple-themed treat boxes, chocolate strawberries, cake pops, Oreos, and custom sweet gifts.",
    eyebrow: "Teacher gifts",
    heroTitle: "Teacher appreciation gifts that feel personal and beautiful",
    heroDescription:
      "Give teachers a gift that feels thoughtful, sweet, and ready to enjoy. Our teacher dessert boxes, dipped treats, Oreos, berries, and cake pops are styled for smiles before the first bite.",
    primaryCtaLabel: "Shop Teacher Gifts",
    primaryCtaHref: "/shop?q=teacher",
    secondaryCtaLabel: "Start Custom Gift",
    secondaryCtaHref: "/custom-orders?occasion=teacher",
    sections: [
      {
        title: "A polished alternative to ordinary gifts",
        body:
          "Teacher appreciation week, end-of-year gifts, school staff surprises, and classroom celebrations are perfect moments for custom dessert gifts."
      },
      {
        title: "Easy gifting in Killeen and Central Texas",
        body:
          "Choose pickup or local delivery when available, and add personal notes or colors that match your school or classroom theme."
      }
    ],
    faqs: [
      {
        question: "Can teacher gifts include custom notes?",
        answer:
          "Yes. Add notes and custom details during checkout or through the custom order page."
      },
      {
        question: "Do you offer bulk teacher gifts?",
        answer:
          "Bulk gifts may be available depending on date and quantity. Use custom orders for staff or school-wide requests."
      }
    ],
    keywords: ["teacher appreciation treats", "teacher gifts Killeen TX", "custom dessert gifts"]
  },
  {
    slug: "graduation-desserts-killeen",
    title: "Graduation Desserts in Killeen TX",
    metaTitle: "Graduation Desserts Killeen TX | Custom Treat Boxes",
    metaDescription:
      "Order graduation desserts in Killeen TX including custom cake pops, chocolate covered strawberries, Oreos, treat boxes, and event sweets for Central Texas grads.",
    eyebrow: "Graduation sweets",
    heroTitle: "Graduation desserts made for proud Central Texas moments",
    heroDescription:
      "Celebrate your graduate with custom colors, sweet boxes, cake pops, chocolate covered strawberries, Oreos, and dessert-table treats designed to feel beautiful, personal, and memorable.",
    primaryCtaLabel: "Reserve Graduation Treats",
    primaryCtaHref: "/custom-orders?occasion=graduation",
    secondaryCtaLabel: "Shop Graduation",
    secondaryCtaHref: "/shop?q=graduation",
    sections: [
      {
        title: "Custom colors and school themes",
        body:
          "Graduation sweets can be styled around school colors, class year, packaging details, and dessert table needs."
      },
      {
        title: "Limited seasonal availability",
        body:
          "Graduation season fills quickly in Killeen, Fort Hood, Harker Heights, Belton, Temple, and Central Texas, so early booking is recommended."
      }
    ],
    faqs: [
      {
        question: "Can graduation treats match school colors?",
        answer:
          "Yes. Share school colors, theme, event date, and quantity through the custom order form."
      },
      {
        question: "Do you make graduation dessert boxes?",
        answer:
          "Yes. Treat boxes, berries, cake pops, Oreos, and assorted custom sweets can be requested."
      }
    ],
    keywords: ["graduation desserts Killeen", "graduation treats Central Texas", "custom dessert boxes"]
  }
];

export const blogPosts: BlogPost[] = [
  {
    slug: "best-chocolate-covered-strawberries-killeen-tx",
    category: "luxury gifting",
    title: "Best Chocolate Covered Strawberries in Killeen TX",
    metaTitle: "Best Chocolate Covered Strawberries in Killeen TX",
    metaDescription:
      "A local guide to choosing luxury chocolate covered strawberries in Killeen TX for birthdays, anniversaries, teachers, Fort Hood gifts, and special occasions.",
    excerpt:
      "What makes a strawberry box feel luxury, gift-ready, and worth sharing? Here is what Killeen customers should look for.",
    publishedAt: "2026-05-06",
    readTime: "4 min read",
    sections: [
      {
        title: "Presentation matters before the first bite",
        body:
          "The best chocolate covered strawberries feel like a complete gift. Look for clean dipping, thoughtful colors, premium packaging, and a style that matches the occasion."
      },
      {
        title: "Local pickup and delivery make gifting easier",
        body:
          "For Killeen, Fort Hood, and nearby Central Texas customers, local availability matters. A fresh berry box should be timed close to pickup or delivery."
      }
    ],
    faqs: [
      {
        question: "Are chocolate covered strawberries good for birthdays?",
        answer:
          "Yes. They are gift-ready, easy to personalize, and feel more memorable than many ordinary birthday gifts."
      },
      {
        question: "How early should I order?",
        answer:
          "Two to three days notice is recommended, especially for custom colors or weekend pickup."
      }
    ]
  },
  {
    slug: "luxury-dessert-gift-ideas-for-teachers",
    category: "teacher appreciation",
    title: "Luxury Dessert Gift Ideas for Teachers",
    metaTitle: "Luxury Dessert Gift Ideas for Teachers | Killeen TX",
    metaDescription:
      "Thoughtful teacher appreciation dessert gift ideas including treat boxes, cake pops, dipped Oreos, and chocolate covered strawberries in Killeen TX.",
    excerpt:
      "Teacher gifts do not have to feel generic. A custom sweet gift can feel personal, polished, and easy to love.",
    publishedAt: "2026-05-06",
    readTime: "3 min read",
    sections: [
      {
        title: "Choose something gift-ready",
        body:
          "Teachers receive many thoughtful items, but beautifully packaged edible gifts stand out because they can enjoy them right away or share them."
      },
      {
        title: "Add color, notes, and classroom details",
        body:
          "Small personal touches such as apple-inspired colors, school colors, or a short note make the gift feel intentional."
      }
    ],
    faqs: [
      {
        question: "What desserts work best for teacher gifts?",
        answer:
          "Treat boxes, dipped Oreos, cake pops, and chocolate covered strawberries are all strong teacher gift options."
      },
      {
        question: "Can teacher gifts be ordered in bulk?",
        answer:
          "Bulk orders may be available with advance notice through the custom order form."
      }
    ]
  },
  {
    slug: "graduation-treat-ideas-central-texas",
    category: "graduations",
    title: "Graduation Treat Ideas in Central Texas",
    metaTitle: "Graduation Treat Ideas in Central Texas | Killeen Desserts",
    metaDescription:
      "Custom graduation dessert ideas for Killeen and Central Texas, including cake pops, treat boxes, chocolate covered strawberries, Oreos, and dessert tables.",
    excerpt:
      "Graduation season is the perfect time for custom sweets that match school colors, photos, and family celebration themes.",
    publishedAt: "2026-05-06",
    readTime: "4 min read",
    sections: [
      {
        title: "Match the school colors",
        body:
          "Color-coordinated drizzle, sprinkles, ribbons, and packaging can make dessert boxes and cake pops feel tied to the graduation moment."
      },
      {
        title: "Plan for gifting and tables",
        body:
          "Some graduation treats are best boxed as gifts, while others work beautifully on dessert tables. Decide whether the treats need to travel, display, or serve a crowd."
      }
    ],
    faqs: [
      {
        question: "What are good graduation desserts?",
        answer:
          "Cake pops, chocolate covered strawberries, dipped Oreos, treat boxes, and custom dessert trays are popular graduation choices."
      },
      {
        question: "When should graduation desserts be ordered?",
        answer:
          "Order as early as possible because graduation season availability fills quickly."
      }
    ]
  },
  {
    slug: "best-custom-cake-pops-near-fort-hood",
    category: "dessert ideas",
    title: "Best Custom Cake Pops Near Fort Hood",
    metaTitle: "Custom Cake Pops Near Fort Hood | Killeen TX",
    metaDescription:
      "Looking for custom cake pops near Fort Hood? L&A Amor & Sugar creates luxury designer pops for birthdays, military events, graduations, and Central Texas celebrations.",
    excerpt:
      "Custom cake pops are a smart sweet for parties, pickup gifts, and branded event moments near Fort Hood and Killeen.",
    publishedAt: "2026-05-06",
    readTime: "3 min read",
    sections: [
      {
        title: "Small treats, big visual impact",
        body:
          "Cake pops are compact, easy to display, and perfect for matching colors, themes, and event aesthetics."
      },
      {
        title: "Use custom details wisely",
        body:
          "Choose colors, sprinkles, packaging, and simple decorative cues that match the event without overcomplicating the design."
      }
    ],
    faqs: [
      {
        question: "Can cake pops be customized for military events?",
        answer:
          "Yes. Share colors, event details, and pickup timing through the custom order form."
      },
      {
        question: "Are cake pops good for events?",
        answer:
          "Yes. They are easy to serve, easy to package, and work well for dessert tables or individual gifts."
      }
    ]
  }
];

export function getLocalSeoPage(slug: string) {
  return localSeoPages.find((page) => page.slug === slug) ?? null;
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
