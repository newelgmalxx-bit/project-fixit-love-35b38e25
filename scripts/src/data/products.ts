import productHair from "@/assets/product-haircare.jpg";
import productSkin from "@/assets/product-skincare.jpg";
import productProtein from "@/assets/product-protein.jpg";
import productSpa from "@/assets/product-spa.jpg";

export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  gallery?: string[];
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  stock?: number;
  shortDesc: string;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
};

export const products: Product[] = [
  {
    id: "1",
    title: "سيروم العناية الفاخر للشعر",
    brand: "Luxor Hair",
    category: "العناية بالشعر",
    image: productHair,
    price: 189,
    oldPrice: 320,
    rating: 4.8,
    reviews: 214,
    badge: "الأكثر مبيعًا",
    stock: 32,
    shortDesc: "سيروم مغذٍّ بزيوت الأرغان والكيراتين لشعر لامع وحيوي من أول استخدام.",
    description:
      "سيروم مركّز يجمع بين زيت الأرغان المغربي الأصلي والكيراتين النباتي لاستعادة لمعان الشعر، ترميم الأطراف المتقصفة، وتقليل التجعّد. تركيبة خفيفة لا تترك أثرًا دهنيًا، مناسبة لجميع أنواع الشعر بما في ذلك المعالج والمصبوغ.",
    features: [
      "حماية حرارية حتى 230°م",
      "بدون سلفات أو بارابين",
      "تركيبة مغربية أصلية",
      "نتائج مرئية خلال أسبوعين",
    ],
    specs: [
      { label: "الحجم", value: "100 مل" },
      { label: "نوع الشعر", value: "كل الأنواع" },
      { label: "بلد المنشأ", value: "فرنسا" },
      { label: "تاريخ الانتهاء", value: "24 شهر من الإنتاج" },
    ],
  },
  {
    id: "2",
    title: "سيروم تفتيح وترطيب البشرة",
    brand: "Glow Lab",
    category: "العناية بالبشرة",
    image: productSkin,
    price: 145,
    oldPrice: 250,
    rating: 4.9,
    reviews: 412,
    badge: "جديد",
    stock: 58,
    shortDesc: "فيتامين سي 15% + حمض الهيالورونيك لبشرة موحّدة ومشرقة.",
    description:
      "سيروم يومي بتركيبة طبية تجمع فيتامين C النقي (15%)، حمض الهيالورونيك، وفيتامين E لمعالجة البقع الداكنة، توحيد لون البشرة، وترطيب عميق لساعات طويلة. مناسب للاستخدام صباحًا تحت الواقي الشمسي.",
    features: [
      "فيتامين C نقي 15%",
      "ترطيب عميق 24 ساعة",
      "خالٍ من العطور والكحول",
      "مختبر سريريًا",
    ],
    specs: [
      { label: "الحجم", value: "30 مل" },
      { label: "نوع البشرة", value: "كل الأنواع وخاصة الباهتة" },
      { label: "بلد المنشأ", value: "كوريا الجنوبية" },
      { label: "الاستخدام", value: "صباحًا ومساءً" },
    ],
  },
  {
    id: "3",
    title: "بروتين واي ايزوليت 2 كجم",
    brand: "Pure Whey",
    category: "مكملات اللياقة",
    image: productProtein,
    price: 279,
    oldPrice: 399,
    rating: 4.7,
    reviews: 178,
    stock: 17,
    shortDesc: "بروتين واي معزول عالي النقاء، 27 جم بروتين لكل حصة.",
    description:
      "بروتين واي ايزوليت عالي الجودة بنسبة بروتين 90%، سهل الذوبان وسريع الامتصاص، مثالي بعد التمرين لاستشفاء العضلات وبناء الكتلة العضلية الصافية. خالٍ من السكر والجلوتين.",
    features: [
      "27 جم بروتين / حصة",
      "أقل من 1 جم سكر",
      "BCAA طبيعي 6.2 جم",
      "نكهة لذيذة سهلة الذوبان",
    ],
    specs: [
      { label: "الوزن", value: "2 كجم" },
      { label: "عدد الحصص", value: "60 حصة" },
      { label: "النكهة", value: "شوكولاتة / فانيلا" },
      { label: "بلد المنشأ", value: "الولايات المتحدة" },
    ],
  },
  {
    id: "4",
    title: "مجموعة زيوت سبا عطرية",
    brand: "Zen Spa",
    category: "سبا وعطور",
    image: productSpa,
    price: 99,
    oldPrice: 160,
    rating: 4.6,
    reviews: 95,
    badge: "عرض اليوم",
    stock: 41,
    shortDesc: "6 زيوت أساسية للاسترخاء، اللافندر والياسمين والورد وغيرها.",
    description:
      "مجموعة فاخرة من 6 زيوت أساسية طبيعية 100% للاستخدام في جلسات السبا المنزلي، المساج، والعلاج بالروائح. مثالية للاسترخاء، تحسين النوم، وتهدئة الأعصاب.",
    features: [
      "6 زيوت أساسية طبيعية",
      "صناعة يدوية",
      "علبة هدية فاخرة",
      "مناسبة للناشرات الكهربائية",
    ],
    specs: [
      { label: "العدد", value: "6 × 10 مل" },
      { label: "المكونات", value: "زيوت طبيعية 100%" },
      { label: "بلد المنشأ", value: "فرنسا" },
      { label: "الاستخدام", value: "ناشر / مساج / حمام" },
    ],
  },
];

export const getProductById = (id: string) => products.find((p) => p.id === id);
