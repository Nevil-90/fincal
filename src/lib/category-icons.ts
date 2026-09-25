import React from 'react'
import {
  // Finance & Income
  IndianRupee,
  BadgeIndianRupee,
  Briefcase,
  BriefcaseBusiness,
  ChartCandlestick,
  TrendingUp,
  TrendingDown,
  ChartLine,
  ChartPie,
  ChartColumnIncreasing,
  RotateCcw,
  Undo2,
  BadgePercent,
  Percent,
  Coins,
  PiggyBank,
  Landmark,
  Wallet,
  WalletCards,
  CreditCard,
  Banknote,
  Receipt,
  ReceiptIndianRupee,
  ReceiptText,
  Vault,
  Scale,
  CircleDollarSign,

  // Career & Education
  GraduationCap,
  School,
  BookOpen,
  Book,
  Award,
  Trophy,
  Handshake,
  Code,
  Terminal,
  FileText,
  FileSpreadsheet,
  BadgeCheck,
  UserCheck,
  Pencil,

  // Food & Dining
  Utensils,
  Coffee,
  Pizza,
  ShoppingBasket,
  Cake,
  Wine,
  Beer,
  Apple,
  Cookie,
  CupSoda,
  Soup,
  IceCream,
  Croissant,
  Drumstick,
  Fish,
  Wheat,

  // Shopping & Goods
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Watch,
  Glasses,
  Footprints,
  Package,
  Gift,
  Gem,
  Tag,
  Sparkles,
  QrCode,

  // Transport & Travel
  Car,
  CarFront,
  Fuel,
  Plane,
  TrainFront,
  Bus,
  Bike,
  Luggage,
  MapPin,
  Compass,
  Navigation,
  Ship,
  ParkingMeter,
  Truck,

  // Tech & Digital
  Cloud,
  Repeat,
  Laptop,
  Smartphone,
  Bot,
  Cpu,
  Wifi,
  Globe,
  Database,
  Server,
  Monitor,
  Tv,
  Radio,

  // Entertainment & Fun
  Film,
  Music,
  Gamepad2,
  Headphones,
  Camera,
  Ticket,
  Clapperboard,
  PartyPopper,
  Palette,
  Dices,

  // Health & Wellness
  HeartPulse,
  Pill,
  Dumbbell,
  Stethoscope,
  Activity,
  Scissors,
  Smile,
  ShieldAlert,

  // Home & Utilities
  Home,
  Building2,
  Building,
  Zap,
  Droplets,
  Flame,
  Wrench,
  Key,
  Sofa,
  Armchair,
  Bed,
  Hammer,
  ShowerHead,
  ShieldCheck,
  SunMedium,
  Lightbulb,
  Plug,

  // Personal, Family & Giving
  Heart,
  PawPrint,
  Baby,
  Sprout,
  Flower2,
  TreePine,
  Bell,
  Bookmark,
  Layers,
  Flag,
  Target,

  type LucideIcon
} from 'lucide-react'

export type CategoryGroup =
  | 'Finance & Income'
  | 'Career & Education'
  | 'Food & Dining'
  | 'Shopping'
  | 'Travel'
  | 'Entertainment'
  | 'Tech & Digital'
  | 'Health & Wellness'
  | 'Home & Utilities'
  | 'Personal & Family'

export interface CategoryIconMeta {
  id: string
  label: string
  group: CategoryGroup
  icon: LucideIcon
  colorClass: string
  bgClass: string
  borderClass: string
  keywords: string[]
}

export const CATEGORY_GROUPS: readonly CategoryGroup[] = [
  'Finance & Income',
  'Career & Education',
  'Food & Dining',
  'Shopping',
  'Travel',
  'Entertainment',
  'Tech & Digital',
  'Health & Wellness',
  'Home & Utilities',
  'Personal & Family'
] as const

export const CATEGORY_ICON_CATALOG: CategoryIconMeta[] = [
  // ─── Finance & Income (24 icons) ───
  {
    id: 'candlestick',
    label: 'IPO & Stock Market',
    group: 'Finance & Income',
    icon: ChartCandlestick,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['ipo', 'stocks', 'equity', 'shares', 'trading', 'demat', 'allotment', 'market', 'zerodha', 'groww', 'upstox', 'bull']
  },
  {
    id: 'rotate-ccw',
    label: 'Refunds & Returns',
    group: 'Finance & Income',
    icon: RotateCcw,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['refund', 'refunds', 'return', 'returns', 'cashback', 'reimbursement', 'reversal', 'chargeback', 'rebate', 'moneyback']
  },
  {
    id: 'undo-cashback',
    label: 'Cashback & Reversals',
    group: 'Finance & Income',
    icon: Undo2,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['cashback', 'rewards', 'points', 'undo', 'reversal', 'settlement', 'reclaim']
  },
  {
    id: 'badge-percent',
    label: 'Dividends & Interest',
    group: 'Finance & Income',
    icon: BadgePercent,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['dividend', 'interest', 'fd', 'fixed deposit', 'yield', 'percent', 'savings interest', 'payout', 'commission', 'royalty']
  },
  {
    id: 'briefcase',
    label: 'Salary & Job',
    group: 'Finance & Income',
    icon: Briefcase,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['salary', 'job', 'work', 'employment', 'payroll', 'wages', 'ctc', 'paycheck', 'office', 'profession']
  },
  {
    id: 'briefcase-biz',
    label: 'Business & Career',
    group: 'Finance & Income',
    icon: BriefcaseBusiness,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['business', 'consulting', 'corporate', 'agency', 'enterprise', 'partnership', 'firm']
  },
  {
    id: 'indian-rupee',
    label: 'Rupee & Currency',
    group: 'Finance & Income',
    icon: IndianRupee,
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-100/70 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-300/70 dark:border-emerald-800/50',
    keywords: ['rupee', 'inr', 'currency', 'money', 'cash', 'income', 'earning', 'payment']
  },
  {
    id: 'badge-rupee',
    label: 'Rupee Badge',
    group: 'Finance & Income',
    icon: BadgeIndianRupee,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['rupee', 'income', 'stipend', 'allowance', 'earnings', 'revenue']
  },
  {
    id: 'trending-up',
    label: 'Investments & Growth',
    group: 'Finance & Income',
    icon: TrendingUp,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['investments', 'stocks', 'growth', 'profit', 'capital gain', 'bull', 'portfolio', 'sip', 'mutual funds']
  },
  {
    id: 'trending-down',
    label: 'Depreciation & Losses',
    group: 'Finance & Income',
    icon: TrendingDown,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['loss', 'depreciation', 'bear', 'drop', 'writeoff']
  },
  {
    id: 'chart-line',
    label: 'Trading & Markets',
    group: 'Finance & Income',
    icon: ChartLine,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['trading', 'options', 'futures', 'derivatives', 'crypto', 'forex', 'market', 'chart']
  },
  {
    id: 'chart-pie',
    label: 'Portfolio & Allocation',
    group: 'Finance & Income',
    icon: ChartPie,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['portfolio', 'allocation', 'assets', 'net worth', 'diversification', 'pie']
  },
  {
    id: 'chart-column',
    label: 'Revenue & Performance',
    group: 'Finance & Income',
    icon: ChartColumnIncreasing,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['revenue', 'turnover', 'sales', 'performance', 'metrics', 'volume']
  },
  {
    id: 'coins',
    label: 'SIP & Mutual Funds',
    group: 'Finance & Income',
    icon: Coins,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['coins', 'sip', 'mutual fund', 'gold', 'crypto', 'digital gold', 'change', 'pocket money']
  },
  {
    id: 'piggy-bank',
    label: 'Savings & Deposits',
    group: 'Finance & Income',
    icon: PiggyBank,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['savings', 'deposit', 'recurring deposit', 'rd', 'piggy', 'emergency fund', 'nest egg']
  },
  {
    id: 'landmark',
    label: 'Banking & Taxes',
    group: 'Finance & Income',
    icon: Landmark,
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-100/60 dark:bg-blue-950/50',
    borderClass: 'border-blue-300/70 dark:border-blue-800/50',
    keywords: ['bank', 'banking', 'taxes', 'gst', 'income tax', 'tds', 'government', 'treasury', 'sbi', 'hdfc', 'icici']
  },
  {
    id: 'wallet',
    label: 'Wallet & Cash',
    group: 'Finance & Income',
    icon: Wallet,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    borderClass: 'border-violet-200/70 dark:border-violet-800/40',
    keywords: ['wallet', 'cash', 'paytm', 'phonepe', 'gpay', 'allowance', 'petty cash']
  },
  {
    id: 'wallet-cards',
    label: 'Cards & Wallets',
    group: 'Finance & Income',
    icon: WalletCards,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['cards', 'debit card', 'membership card', 'forex card']
  },
  {
    id: 'banknote',
    label: 'Cash & Notes',
    group: 'Finance & Income',
    icon: Banknote,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['cash', 'notes', 'currency', 'atm', 'withdrawal', 'physical money']
  },
  {
    id: 'credit-card',
    label: 'Credit Card & Loan',
    group: 'Finance & Income',
    icon: CreditCard,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['credit card', 'emi', 'loan', 'bill', 'debt', 'visa', 'mastercard', 'amex']
  },
  {
    id: 'receipt',
    label: 'Invoices & Bills',
    group: 'Finance & Income',
    icon: Receipt,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['receipt', 'bill', 'invoice', 'utility bill', 'slip', 'voucher']
  },
  {
    id: 'receipt-rupee',
    label: 'Rupee Receipt',
    group: 'Finance & Income',
    icon: ReceiptIndianRupee,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['receipt', 'rupee receipt', 'reimbursement bill', 'expense claim', 'proof']
  },
  {
    id: 'receipt-text',
    label: 'Tax & Statements',
    group: 'Finance & Income',
    icon: ReceiptText,
    colorClass: 'text-slate-700 dark:text-neutral-300',
    bgClass: 'bg-slate-100/70 dark:bg-white/[0.06]',
    borderClass: 'border-slate-200/80 dark:border-white/[0.08]',
    keywords: ['statement', 'form 16', 'tax document', 'audit', 'financial report']
  },
  {
    id: 'vault',
    label: 'Safe & Emergency Fund',
    group: 'Finance & Income',
    icon: Vault,
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-100/60 dark:bg-amber-950/40',
    borderClass: 'border-amber-300/70 dark:border-amber-800/50',
    keywords: ['vault', 'safe', 'locker', 'gold deposit', 'fixed reserve', 'emergency fund']
  },
  {
    id: 'scale',
    label: 'Legal & Accounting',
    group: 'Finance & Income',
    icon: Scale,
    colorClass: 'text-neutral-600 dark:text-neutral-400',
    bgClass: 'bg-neutral-100 dark:bg-white/[0.06]',
    borderClass: 'border-neutral-200 dark:border-white/[0.08]',
    keywords: ['legal', 'ca fees', 'accounting', 'compliance', 'fine', 'penalty']
  },

  // ─── Career & Education (14 icons) ───
  {
    id: 'graduation-cap',
    label: 'Internship & Degree',
    group: 'Career & Education',
    icon: GraduationCap,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    borderClass: 'border-violet-200/70 dark:border-violet-800/40',
    keywords: ['internship', 'intern', 'stipend', 'trainee', 'apprentice', 'student', 'college', 'university', 'degree', 'graduation', 'tuition']
  },
  {
    id: 'school',
    label: 'College & Academy',
    group: 'Career & Education',
    icon: School,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['school', 'college', 'campus', 'institute', 'academy', 'education', 'admission']
  },
  {
    id: 'book-open',
    label: 'Courses & Learning',
    group: 'Career & Education',
    icon: BookOpen,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['course', 'udemy', 'coursera', 'learning', 'training', 'classes', 'upskilling']
  },
  {
    id: 'book',
    label: 'Books & Reading',
    group: 'Career & Education',
    icon: Book,
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['book', 'kindle', 'reading', 'novels', 'textbook', 'library']
  },
  {
    id: 'award',
    label: 'Appraisal & Bonus',
    group: 'Career & Education',
    icon: Award,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['bonus', 'appraisal', 'incentive', 'reward', 'certificate', 'merit', 'achievement', 'recognition']
  },
  {
    id: 'trophy',
    label: 'Awards & Honors',
    group: 'Career & Education',
    icon: Trophy,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['trophy', 'prize', 'grant', 'scholarship', 'fellowship', 'hackathon', 'contest', 'award']
  },
  {
    id: 'handshake',
    label: 'Consulting & Clients',
    group: 'Career & Education',
    icon: Handshake,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['client', 'consulting', 'freelance', 'contract', 'deal', 'partnership', 'commission', 'retainer']
  },
  {
    id: 'code',
    label: 'Engineering & Freelance',
    group: 'Career & Education',
    icon: Code,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['freelance', 'code', 'programming', 'developer', 'software', 'tech project', 'upwork', 'fiverr']
  },
  {
    id: 'terminal',
    label: 'Tech Development',
    group: 'Career & Education',
    icon: Terminal,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['developer', 'terminal', 'coding', 'api', 'dev tools', 'server']
  },
  {
    id: 'file-text',
    label: 'Documents & Contracts',
    group: 'Career & Education',
    icon: FileText,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['contract', 'agreement', 'papers', 'documentation', 'nda', 'stamp paper']
  },
  {
    id: 'file-spreadsheet',
    label: 'Sheets & Analysis',
    group: 'Career & Education',
    icon: FileSpreadsheet,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['excel', 'spreadsheet', 'data', 'finance analysis', 'modeling']
  },
  {
    id: 'badge-check',
    label: 'Certification & Skills',
    group: 'Career & Education',
    icon: BadgeCheck,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['certification', 'license', 'credential', 'verified', 'exam fee', 'membership']
  },
  {
    id: 'user-check',
    label: 'Mentorship & Coaching',
    group: 'Career & Education',
    icon: UserCheck,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['mentor', 'coach', 'counseling', 'advisory', 'career coach', 'tutor']
  },
  {
    id: 'pencil',
    label: 'Stationery & Writing',
    group: 'Career & Education',
    icon: Pencil,
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['stationery', 'pens', 'notebook', 'desk supplies', 'writing']
  },

  // ─── Food & Dining (16 icons) ───
  {
    id: 'utensils',
    label: 'Restaurants & Dining',
    group: 'Food & Dining',
    icon: Utensils,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['restaurant', 'dining', 'food', 'meal', 'lunch', 'dinner', 'swiggy', 'zomato']
  },
  {
    id: 'coffee',
    label: 'Cafe & Coffee',
    group: 'Food & Dining',
    icon: Coffee,
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-100/70 dark:bg-amber-950/50',
    borderClass: 'border-amber-300/70 dark:border-amber-800/50',
    keywords: ['coffee', 'cafe', 'tea', 'chai', 'starbucks', 'blue tokai', 'espresso', 'cappuccino']
  },
  {
    id: 'pizza',
    label: 'Fast Food & Snacks',
    group: 'Food & Dining',
    icon: Pizza,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200/70 dark:border-orange-800/40',
    keywords: ['pizza', 'burger', 'fast food', 'dominos', 'mcdonalds', 'kfc', 'snacks', 'street food']
  },
  {
    id: 'groceries',
    label: 'Groceries & Mart',
    group: 'Food & Dining',
    icon: ShoppingBasket,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['groceries', 'supermarket', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'vegetables', 'provisions']
  },
  {
    id: 'cake',
    label: 'Bakery & Sweets',
    group: 'Food & Dining',
    icon: Cake,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['bakery', 'cake', 'sweets', 'pastry', 'dessert', 'mithai', 'birthday cake']
  },
  {
    id: 'wine',
    label: 'Bars & Cocktails',
    group: 'Food & Dining',
    icon: Wine,
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['wine', 'bar', 'cocktail', 'liquor', 'alcohol', 'drinks', 'lounge']
  },
  {
    id: 'beer',
    label: 'Pubs & Breweries',
    group: 'Food & Dining',
    icon: Beer,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['beer', 'pub', 'brewery', 'craft beer', 'nightlife']
  },
  {
    id: 'apple',
    label: 'Fruits & Organic',
    group: 'Food & Dining',
    icon: Apple,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-200/70 dark:border-red-800/40',
    keywords: ['fruits', 'organic', 'healthy food', 'salad', 'diet', 'nutrition']
  },
  {
    id: 'cookie',
    label: 'Snacks & Biscuits',
    group: 'Food & Dining',
    icon: Cookie,
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-100/60 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['cookie', 'biscuits', 'namkeen', 'chips', 'confectionery', 'tea time']
  },
  {
    id: 'cup-soda',
    label: 'Beverages & Soft Drinks',
    group: 'Food & Dining',
    icon: CupSoda,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['soda', 'beverage', 'juice', 'smoothie', 'soft drink', 'coke', 'pepsi']
  },
  {
    id: 'soup',
    label: 'Soups & Noodles',
    group: 'Food & Dining',
    icon: Soup,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200/70 dark:border-orange-800/40',
    keywords: ['soup', 'ramen', 'noodles', 'curry', 'dal', 'hot meal']
  },
  {
    id: 'ice-cream',
    label: 'Ice Cream & Gelato',
    group: 'Food & Dining',
    icon: IceCream,
    colorClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    borderClass: 'border-fuchsia-200/70 dark:border-fuchsia-800/40',
    keywords: ['ice cream', 'gelato', 'kulfi', 'sundae', 'frozen treat']
  },
  {
    id: 'croissant',
    label: 'Breakfast & Pastries',
    group: 'Food & Dining',
    icon: Croissant,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['breakfast', 'brunch', 'croissant', 'sandwich', 'pancakes']
  },
  {
    id: 'drumstick',
    label: 'Meat & Non-Veg',
    group: 'Food & Dining',
    icon: Drumstick,
    colorClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-200/70 dark:border-red-800/40',
    keywords: ['meat', 'chicken', 'barbecue', 'bbq', 'non-veg', 'licious']
  },
  {
    id: 'fish',
    label: 'Seafood',
    group: 'Food & Dining',
    icon: Fish,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['seafood', 'fish', 'prawns', 'fresh catch']
  },
  {
    id: 'wheat',
    label: 'Grains & Provisions',
    group: 'Food & Dining',
    icon: Wheat,
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['atta', 'wheat', 'rice', 'grains', 'flour', 'staples', 'ration']
  },

  // ─── Shopping & Goods (12 icons) ───
  {
    id: 'shopping-bag',
    label: 'Shopping',
    group: 'Shopping',
    icon: ShoppingBag,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['shopping', 'mall', 'retail', 'haul', 'lifestyle']
  },
  {
    id: 'shopping-cart',
    label: 'E-Commerce & Orders',
    group: 'Shopping',
    icon: ShoppingCart,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['amazon', 'flipkart', 'myntra', 'online shopping', 'cart', 'checkout']
  },
  {
    id: 'shirt',
    label: 'Apparel & Clothing',
    group: 'Shopping',
    icon: Shirt,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['clothes', 'clothing', 'fashion', 'shirt', 'dress', 'trousers', 'wardrobe', 'zara', 'h&m']
  },
  {
    id: 'watch',
    label: 'Watches & Jewelry',
    group: 'Shopping',
    icon: Watch,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['watch', 'smartwatch', 'apple watch', 'jewelry', 'accessories', 'luxury']
  },
  {
    id: 'glasses',
    label: 'Eyewear & Vision',
    group: 'Shopping',
    icon: Glasses,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['glasses', 'spectacles', 'lenskart', 'sunglasses', 'opticals']
  },
  {
    id: 'footprints',
    label: 'Footwear & Shoes',
    group: 'Shopping',
    icon: Footprints,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['shoes', 'sneakers', 'footwear', 'nike', 'adidas', 'boots', 'sandals']
  },
  {
    id: 'package',
    label: 'Couriers & Delivery',
    group: 'Shopping',
    icon: Package,
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['courier', 'parcel', 'shipping', 'delivery', 'fedex', 'dhl', 'delhivery']
  },
  {
    id: 'gift',
    label: 'Gifts & Celebrations',
    group: 'Shopping',
    icon: Gift,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['gift', 'present', 'anniversary', 'birthday', 'celebration', 'festive']
  },
  {
    id: 'gem',
    label: 'Gold, Silver & Luxury',
    group: 'Shopping',
    icon: Gem,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['gold', 'silver', 'jewelry', 'tanishq', 'diamond', 'luxury', 'precious']
  },
  {
    id: 'tag',
    label: 'Discounts & Deals',
    group: 'Shopping',
    icon: Tag,
    colorClass: 'text-slate-600 dark:text-neutral-400',
    bgClass: 'bg-slate-100 dark:bg-white/[0.06]',
    borderClass: 'border-slate-200/80 dark:border-white/[0.08]',
    keywords: ['deal', 'discount', 'sale', 'clearance', 'coupon', 'promo']
  },
  {
    id: 'sparkles',
    label: 'Special Finds',
    group: 'Shopping',
    icon: Sparkles,
    colorClass: 'text-amber-500 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['special', 'vintage', 'rare', 'aesthetic', 'novelty']
  },
  {
    id: 'qr-code',
    label: 'UPI & Merchant Pay',
    group: 'Shopping',
    icon: QrCode,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['upi', 'qr code', 'scan and pay', 'merchant', 'paytm qr', 'phonepe qr']
  },

  // ─── Transport & Travel (14 icons) ───
  {
    id: 'car',
    label: 'Cab & Uber',
    group: 'Travel',
    icon: Car,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['uber', 'ola', 'rapido', 'cab', 'taxi', 'car ride', 'auto']
  },
  {
    id: 'car-front',
    label: 'Car Maintenance',
    group: 'Travel',
    icon: CarFront,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['car service', 'car wash', 'tyres', 'insurance', 'service center']
  },
  {
    id: 'fuel',
    label: 'Petrol & Diesel',
    group: 'Travel',
    icon: Fuel,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['petrol', 'diesel', 'fuel', 'cng', 'gas station', 'shell', 'hpcl', 'bpcl', 'ioc']
  },
  {
    id: 'plane',
    label: 'Flights & Aviation',
    group: 'Travel',
    icon: Plane,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['flight', 'airline', 'air ticket', 'indigo', 'air india', 'airport', 'aviation']
  },
  {
    id: 'train',
    label: 'Train & Metro',
    group: 'Travel',
    icon: TrainFront,
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-100/60 dark:bg-blue-950/50',
    borderClass: 'border-blue-300/70 dark:border-blue-800/50',
    keywords: ['train', 'metro', 'irctc', 'railway', 'commute', 'subway']
  },
  {
    id: 'bus',
    label: 'Buses & Shuttles',
    group: 'Travel',
    icon: Bus,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['bus', 'shuttle', 'redbus', 'public transit', 'volvo']
  },
  {
    id: 'bike',
    label: 'Bike & Two-Wheeler',
    group: 'Travel',
    icon: Bike,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['bike', 'motorcycle', 'scooter', 'ev bike', 'cycling', 'two wheeler']
  },
  {
    id: 'luggage',
    label: 'Hotels & Vacation',
    group: 'Travel',
    icon: Luggage,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['hotel', 'resort', 'vacation', 'trip', 'airbnb', 'stay', 'holiday']
  },
  {
    id: 'map-pin',
    label: 'Sightseeing & Trips',
    group: 'Travel',
    icon: MapPin,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['sightseeing', 'tourism', 'location', 'travel guide', 'monument']
  },
  {
    id: 'compass',
    label: 'Tours & Exploration',
    group: 'Travel',
    icon: Compass,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['trekking', 'camping', 'adventure', 'expedition', 'safari']
  },
  {
    id: 'navigation',
    label: 'Commute & Tolls',
    group: 'Travel',
    icon: Navigation,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['commute', 'toll', 'fastag', 'gps', 'highway']
  },
  {
    id: 'ship',
    label: 'Cruises & Ferries',
    group: 'Travel',
    icon: Ship,
    colorClass: 'text-sky-700 dark:text-sky-300',
    bgClass: 'bg-sky-100/60 dark:bg-sky-950/50',
    borderClass: 'border-sky-300/70 dark:border-sky-800/50',
    keywords: ['cruise', 'boat', 'ferry', 'island', 'water transit']
  },
  {
    id: 'parking-meter',
    label: 'Parking & Valet',
    group: 'Travel',
    icon: ParkingMeter,
    colorClass: 'text-slate-600 dark:text-neutral-400',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['parking', 'valet', 'fastag parking', 'meter']
  },
  {
    id: 'truck',
    label: 'Packers & Movers',
    group: 'Travel',
    icon: Truck,
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['packers', 'movers', 'freight', 'shifting', 'relocation', 'porter']
  },

  // ─── Tech & Digital (11 icons) ───
  {
    id: 'repeat',
    label: 'Subscriptions & Recurring',
    group: 'Tech & Digital',
    icon: Repeat,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['subscription', 'subscriptions', 'recurring', 'membership', 'renewal', 'saas', 'autopay', 'monthly bill']
  },
  {
    id: 'cloud',
    label: 'Cloud & Subscriptions',
    group: 'Tech & Digital',
    icon: Cloud,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['cloud', 'aws', 'gcp', 'icloud', 'google one', 'dropbox', 'saas', 'subscription']
  },
  {
    id: 'laptop',
    label: 'Hardware & SaaS',
    group: 'Tech & Digital',
    icon: Laptop,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['laptop', 'macbook', 'hardware', 'software', 'pc', 'figma', 'notion', 'computer']
  },
  {
    id: 'smartphone',
    label: 'Smartphones & Apps',
    group: 'Tech & Digital',
    icon: Smartphone,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['smartphone', 'iphone', 'android', 'app store', 'play store', 'in-app purchase']
  },
  {
    id: 'bot',
    label: 'AI Tools & ChatGPT',
    group: 'Tech & Digital',
    icon: Bot,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['ai', 'chatgpt', 'openai', 'claude', 'cursor', 'copilot', 'midjourney', 'llm']
  },
  {
    id: 'cpu',
    label: 'Hosting & Servers',
    group: 'Tech & Digital',
    icon: Cpu,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['hosting', 'vps', 'digitalocean', 'hetzner', 'server', 'computing', 'crypto node']
  },
  {
    id: 'wifi',
    label: 'Broadband & WiFi',
    group: 'Tech & Digital',
    icon: Wifi,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['wifi', 'broadband', 'internet', 'fibernet', 'jiofiber', 'airtel xstream', 'router']
  },
  {
    id: 'globe',
    label: 'Domains & Internet',
    group: 'Tech & Digital',
    icon: Globe,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['domain', 'godaddy', 'namecheap', 'dns', 'cdn', 'cloudflare', 'international']
  },
  {
    id: 'database',
    label: 'Storage & DB',
    group: 'Tech & Digital',
    icon: Database,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['database', 'storage', 'backup', 'supabase', 'neon', 'mongodb']
  },
  {
    id: 'server',
    label: 'Infrastructure',
    group: 'Tech & Digital',
    icon: Server,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['infrastructure', 'datacenter', 'hardware', 'devops']
  },
  {
    id: 'monitor',
    label: 'Displays & Peripherals',
    group: 'Tech & Digital',
    icon: Monitor,
    colorClass: 'text-slate-700 dark:text-neutral-300',
    bgClass: 'bg-slate-100/60 dark:bg-white/[0.06]',
    borderClass: 'border-slate-200/80 dark:border-white/[0.08]',
    keywords: ['monitor', 'screen', 'keyboard', 'mouse', 'desk setup']
  },

  // ─── Entertainment & Fun (12 icons) ───
  {
    id: 'film',
    label: 'Movies & Cinema',
    group: 'Entertainment',
    icon: Film,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['movie', 'cinema', 'theatre', 'pvr', 'inox', 'bookmyshow', 'imax']
  },
  {
    id: 'tv',
    label: 'OTT & Streaming',
    group: 'Entertainment',
    icon: Tv,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-200/70 dark:border-red-800/40',
    keywords: ['netflix', 'prime video', 'disney', 'hotstar', 'youtube premium', 'streaming', 'tv']
  },
  {
    id: 'music',
    label: 'Music & Audio',
    group: 'Entertainment',
    icon: Music,
    colorClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    borderClass: 'border-fuchsia-200/70 dark:border-fuchsia-800/40',
    keywords: ['music', 'spotify', 'apple music', 'songs', 'album', 'concert audio']
  },
  {
    id: 'headphones',
    label: 'Podcasts & Sound',
    group: 'Entertainment',
    icon: Headphones,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['podcast', 'audible', 'audiobook', 'earphones', 'headphones', 'sound']
  },
  {
    id: 'gamepad',
    label: 'Gaming & Consoles',
    group: 'Entertainment',
    icon: Gamepad2,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    borderClass: 'border-violet-200/70 dark:border-violet-800/40',
    keywords: ['gaming', 'playstation', 'xbox', 'steam', 'games', 'nintendo', 'esports']
  },
  {
    id: 'camera',
    label: 'Photography & Gear',
    group: 'Entertainment',
    icon: Camera,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['photography', 'camera', 'dslr', 'lens', 'photoshoot', 'video']
  },
  {
    id: 'ticket',
    label: 'Concerts & Events',
    group: 'Entertainment',
    icon: Ticket,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['concert', 'festival', 'standup comedy', 'event ticket', 'amusement park']
  },
  {
    id: 'clapperboard',
    label: 'Media & Production',
    group: 'Entertainment',
    icon: Clapperboard,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200/70 dark:border-orange-800/40',
    keywords: ['acting', 'filmmaking', 'content creation', 'studio']
  },
  {
    id: 'party-popper',
    label: 'Parties & Nightlife',
    group: 'Entertainment',
    icon: PartyPopper,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['party', 'celebration', 'new year', 'club', 'dj', 'gathering']
  },
  {
    id: 'palette',
    label: 'Art & Hobbies',
    group: 'Entertainment',
    icon: Palette,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['art', 'painting', 'sketching', 'hobby', 'crafts', 'pottery', 'drawing']
  },
  {
    id: 'dices',
    label: 'Board Games & Fun',
    group: 'Entertainment',
    icon: Dices,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['board games', 'cards', 'casino', 'arcade', 'billiards']
  },
  {
    id: 'radio',
    label: 'Radio & Broadcasts',
    group: 'Entertainment',
    icon: Radio,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['radio', 'broadcast', 'live stream', 'fm']
  },

  // ─── Health & Wellness (8 icons) ───
  {
    id: 'heart-pulse',
    label: 'Hospital & Healthcare',
    group: 'Health & Wellness',
    icon: HeartPulse,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['hospital', 'healthcare', 'medical checkup', 'clinic', 'emergency']
  },
  {
    id: 'pill',
    label: 'Medicine & Pharmacy',
    group: 'Health & Wellness',
    icon: Pill,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200/70 dark:border-teal-800/40',
    keywords: ['medicine', 'pharmacy', 'apollo', '1mg', 'pharmeasy', 'supplements', 'vitamins']
  },
  {
    id: 'dumbbell',
    label: 'Gym & Fitness',
    group: 'Health & Wellness',
    icon: Dumbbell,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200/70 dark:border-orange-800/40',
    keywords: ['gym', 'fitness', 'workout', 'cult fit', 'weights', 'crossfit', 'personal trainer']
  },
  {
    id: 'stethoscope',
    label: 'Doctor & Consultation',
    group: 'Health & Wellness',
    icon: Stethoscope,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['doctor', 'consultation', 'physician', 'specialist', 'practo']
  },
  {
    id: 'activity',
    label: 'Diagnostics & Labs',
    group: 'Health & Wellness',
    icon: Activity,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['blood test', 'pathology', 'xray', 'mri', 'diagnostics', 'health checkup']
  },
  {
    id: 'scissors',
    label: 'Salon & Grooming',
    group: 'Health & Wellness',
    icon: Scissors,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['salon', 'barber', 'haircut', 'spa', 'skincare', 'parlour', 'grooming']
  },
  {
    id: 'smile',
    label: 'Dental & Mental Care',
    group: 'Health & Wellness',
    icon: Smile,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['dental', 'dentist', 'therapy', 'counseling', 'mental health', 'wellbeing']
  },
  {
    id: 'shield-alert',
    label: 'Health Emergency',
    group: 'Health & Wellness',
    icon: ShieldAlert,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-200/70 dark:border-red-800/40',
    keywords: ['emergency', 'urgent care', 'ambulance', 'critical']
  },

  // ─── Home & Utilities (17 icons) ───
  {
    id: 'home',
    label: 'House Rent & Home',
    group: 'Home & Utilities',
    icon: Home,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200/70 dark:border-indigo-800/40',
    keywords: ['rent', 'house rent', 'home loan', 'mortgage', 'lease', 'residence']
  },
  {
    id: 'building-2',
    label: 'Apartment & Society',
    group: 'Home & Utilities',
    icon: Building2,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['society', 'maintenance', 'apartment', 'flat', 'gated community', 'mygate']
  },
  {
    id: 'building',
    label: 'Real Estate & Property',
    group: 'Home & Utilities',
    icon: Building,
    colorClass: 'text-cyan-700 dark:text-cyan-300',
    bgClass: 'bg-cyan-100/60 dark:bg-cyan-950/50',
    borderClass: 'border-cyan-300/70 dark:border-cyan-800/50',
    keywords: ['property', 'real estate', 'plot', 'commercial', 'rental income', 'leasehold']
  },
  {
    id: 'zap',
    label: 'Electricity Bill',
    group: 'Home & Utilities',
    icon: Zap,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['electricity', 'power bill', 'current', 'bescom', 'mseb', 'tneb', 'electric']
  },
  {
    id: 'droplets',
    label: 'Water Bill',
    group: 'Home & Utilities',
    icon: Droplets,
    colorClass: 'text-blue-500 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['water', 'water tanker', 'water bill', 'plumbing supply']
  },
  {
    id: 'flame',
    label: 'Gas & LPG Cylinder',
    group: 'Home & Utilities',
    icon: Flame,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200/70 dark:border-orange-800/40',
    keywords: ['gas', 'lpg', 'cylinder', 'indane', 'hp gas', 'piped gas', 'png']
  },
  {
    id: 'wrench',
    label: 'Repairs & Plumbing',
    group: 'Home & Utilities',
    icon: Wrench,
    colorClass: 'text-slate-600 dark:text-neutral-300',
    bgClass: 'bg-slate-100 dark:bg-white/[0.08]',
    borderClass: 'border-slate-200 dark:border-white/[0.12]',
    keywords: ['repair', 'plumber', 'carpenter', 'urban company', 'handyman', 'maintenance']
  },
  {
    id: 'key',
    label: 'Keys & Locksmith',
    group: 'Home & Utilities',
    icon: Key,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['key', 'locksmith', 'deposit', 'rental agreement', 'access']
  },
  {
    id: 'sofa',
    label: 'Furniture & Living',
    group: 'Home & Utilities',
    icon: Sofa,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200/70 dark:border-purple-800/40',
    keywords: ['furniture', 'sofa', 'ikea', 'pepperfry', 'wooden street', 'living room']
  },
  {
    id: 'armchair',
    label: 'Home Decor',
    group: 'Home & Utilities',
    icon: Armchair,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['decor', 'cushions', 'rugs', 'home furnishing', 'interiors']
  },
  {
    id: 'bed',
    label: 'Bedroom & Linens',
    group: 'Home & Utilities',
    icon: Bed,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['bed', 'mattress', 'wakefit', 'bedsheet', 'curtains']
  },
  {
    id: 'hammer',
    label: 'Renovation & Hardware',
    group: 'Home & Utilities',
    icon: Hammer,
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['renovation', 'construction', 'hardware', 'tools', 'painting work']
  },
  {
    id: 'shower-head',
    label: 'Bath & Sanitary',
    group: 'Home & Utilities',
    icon: ShowerHead,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['bathroom', 'sanitary', 'shower', 'fittings', 'toiletries']
  },
  {
    id: 'shield-check',
    label: 'Insurance & Security',
    group: 'Home & Utilities',
    icon: ShieldCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['insurance', 'home insurance', 'security guard', 'cctv', 'safeguard']
  },
  {
    id: 'sun-medium',
    label: 'Solar & Clean Energy',
    group: 'Home & Utilities',
    icon: SunMedium,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['solar', 'green energy', 'inverter', 'battery', 'ups']
  },
  {
    id: 'lightbulb',
    label: 'Lighting & Electrician',
    group: 'Home & Utilities',
    icon: Lightbulb,
    colorClass: 'text-yellow-500 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-200/70 dark:border-yellow-800/40',
    keywords: ['lighting', 'bulbs', 'led', 'electrician', 'fixtures']
  },
  {
    id: 'plug',
    label: 'Appliances & Electronics',
    group: 'Home & Utilities',
    icon: Plug,
    colorClass: 'text-slate-600 dark:text-neutral-400',
    bgClass: 'bg-slate-100 dark:bg-white/[0.06]',
    borderClass: 'border-slate-200/80 dark:border-white/[0.08]',
    keywords: ['appliances', 'washing machine', 'fridge', 'refrigerator', 'microwave', 'ac service']
  },

  // ─── Personal, Family & Giving (11 icons) ───
  {
    id: 'heart',
    label: 'Charity & Donations',
    group: 'Personal & Family',
    icon: Heart,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['charity', 'donation', 'ngo', 'temple', 'gurudwara', 'trust', 'giving', 'relief']
  },
  {
    id: 'paw-print',
    label: 'Pets & Veterinary',
    group: 'Personal & Family',
    icon: PawPrint,
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200/70 dark:border-amber-800/40',
    keywords: ['pet', 'dog', 'cat', 'vet', 'pet food', 'pedigree', 'royal canin', 'veterinary']
  },
  {
    id: 'baby',
    label: 'Kids & Childcare',
    group: 'Personal & Family',
    icon: Baby,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200/70 dark:border-sky-800/40',
    keywords: ['baby', 'kids', 'diapers', 'childcare', 'daycare', 'toys', 'firstcry']
  },
  {
    id: 'sprout',
    label: 'Gardening & Plants',
    group: 'Personal & Family',
    icon: Sprout,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['garden', 'plants', 'nursery', 'seeds', 'pots', 'fertilizer']
  },
  {
    id: 'flower-2',
    label: 'Florist & Flowers',
    group: 'Personal & Family',
    icon: Flower2,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    borderClass: 'border-pink-200/70 dark:border-pink-800/40',
    keywords: ['flowers', 'bouquet', 'florist', 'pooja flowers']
  },
  {
    id: 'tree-pine',
    label: 'Nature & Outdoor',
    group: 'Personal & Family',
    icon: TreePine,
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-100/60 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-300/70 dark:border-emerald-800/50',
    keywords: ['nature', 'hiking', 'environment', 'eco']
  },
  {
    id: 'bell',
    label: 'Alerts & Reminders',
    group: 'Personal & Family',
    icon: Bell,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderClass: 'border-cyan-200/70 dark:border-cyan-800/40',
    keywords: ['reminder', 'alert', 'notice', 'notification']
  },
  {
    id: 'bookmark',
    label: 'Saved & Wishlist',
    group: 'Personal & Family',
    icon: Bookmark,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200/70 dark:border-blue-800/40',
    keywords: ['saved', 'wishlist', 'favorite', 'archive']
  },
  {
    id: 'layers',
    label: 'Miscellaneous',
    group: 'Personal & Family',
    icon: Layers,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    borderClass: 'border-violet-200/70 dark:border-violet-800/40',
    keywords: ['other', 'misc', 'general', 'layers', 'uncategorized']
  },
  {
    id: 'flag',
    label: 'Milestones & Events',
    group: 'Personal & Family',
    icon: Flag,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200/70 dark:border-emerald-800/40',
    keywords: ['milestone', 'target achieved', 'life event', 'flag']
  },
  {
    id: 'target',
    label: 'Personal Goals',
    group: 'Personal & Family',
    icon: Target,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200/70 dark:border-rose-800/40',
    keywords: ['goal', 'target', 'objective', 'financial goal', 'aim']
  }
]

// Map id -> CategoryIconMeta for O(1) lookup
export const CATEGORY_ICON_MAP = new Map<string, CategoryIconMeta>(
  CATEGORY_ICON_CATALOG.map(item => [item.id, item])
)

// Dynamic fallback palettes for unmapped custom categories
const DYNAMIC_FALLBACK_PALETTES = [
  { id: 'sparkles', label: 'Special Occasions', icon: Sparkles, colorClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40', borderClass: 'border-amber-200/70 dark:border-amber-800/40' },
  { id: 'target', label: 'Goals & Targets', icon: Target, colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/40', borderClass: 'border-rose-200/70 dark:border-rose-800/40' },
  { id: 'bookmark', label: 'Saved Items', icon: Bookmark, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40', borderClass: 'border-blue-200/70 dark:border-blue-800/40' },
  { id: 'compass', label: 'Exploration', icon: Compass, colorClass: 'text-teal-600 dark:text-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-950/40', borderClass: 'border-teal-200/70 dark:border-teal-800/40' },
  { id: 'layers', label: 'General Categories', icon: Layers, colorClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-50 dark:bg-violet-950/40', borderClass: 'border-violet-200/70 dark:border-violet-800/40' },
  { id: 'flag', label: 'Milestones', icon: Flag, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderClass: 'border-emerald-200/70 dark:border-emerald-800/40' },
  { id: 'gem', label: 'Luxury & Assets', icon: Gem, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-purple-200/70 dark:border-purple-800/40' },
  { id: 'lightbulb', label: 'Innovation', icon: Lightbulb, colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-50 dark:bg-yellow-950/40', borderClass: 'border-yellow-200/70 dark:border-yellow-800/40' },
  { id: 'package', label: 'Goods & Supplies', icon: Package, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40', borderClass: 'border-indigo-200/70 dark:border-indigo-800/40' },
  { id: 'bell', label: 'Alerts & Reminders', icon: Bell, colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-950/40', borderClass: 'border-cyan-200/70 dark:border-cyan-800/40' }
]

function hashStringToPaletteIndex(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % DYNAMIC_FALLBACK_PALETTES.length
}

export interface CategoryVisual {
  id: string
  label: string
  icon: LucideIcon
  colorClass: string
  bgClass: string
  borderClass: string
  bg: string
}

export function toVisual(meta: CategoryIconMeta): CategoryVisual {
  return {
    id: meta.id,
    label: meta.label,
    icon: meta.icon,
    colorClass: meta.colorClass,
    bgClass: meta.bgClass,
    borderClass: meta.borderClass,
    bg: `${meta.bgClass} ${meta.colorClass} border ${meta.borderClass}`
  }
}

/**
 * Intelligent Category & Title Visual Resolver
 * Resolves icon, background, and border classes based on:
 * 1. Explicit user custom icon override
 * 2. Merchant / Title keywords (e.g. Spotify -> Music, Starbucks -> Coffee)
 * 3. Specific category keywords (Internship, IPO, Refund, Salary, Wifi, etc.)
 * 4. Income vs Expense context
 * 5. Deterministic visual hashing fallback
 */
export function getCategoryVisual(
  category?: string | null,
  type?: string | null,
  titleOrDescription?: string | null,
  customIconMap?: Record<string, string> | null
): CategoryVisual {
  const cat = (category || '').trim()
  const catLower = cat.toLowerCase()
  const titleLower = (titleOrDescription || '').toLowerCase()
  const typeLower = (type || '').toLowerCase()
  const isIncome = typeLower === 'income' || typeLower === 'incomecategories'

  // 1. Check user custom icon mapping first
  if (cat && customIconMap && customIconMap[cat]) {
    const iconId = customIconMap[cat]
    const meta = CATEGORY_ICON_MAP.get(iconId)
    if (meta) {
      return toVisual(meta)
    }
  }

  // Helper to check if category is specific (not an empty or generic fallback bucket)
  const isSpecificCategory = cat &&
    catLower !== 'other' &&
    catLower !== 'others' &&
    catLower !== 'other expense' &&
    catLower !== 'other income' &&
    catLower !== 'general' &&
    catLower !== 'misc' &&
    catLower !== 'miscellaneous' &&
    catLower !== 'uncategorized' &&
    catLower !== 'expense' &&
    catLower !== 'income'

  // 2. Resolve Category Visual (PRIORITY: Category determines the icon)
  if (cat) {
    // ─── A. Exact ID or Exact Label Match in Catalog ───
    if (CATEGORY_ICON_MAP.has(catLower)) {
      return toVisual(CATEGORY_ICON_MAP.get(catLower)!)
    }
    const exactLabelMatch = CATEGORY_ICON_CATALOG.find(item => item.label.toLowerCase() === catLower)
    if (exactLabelMatch) {
      return toVisual(exactLabelMatch)
    }

    // ─── B. High Precision Category String Heuristics ───

    // Subscriptions, SaaS & Recurring
    if (
      catLower.includes('subscript') ||
      catLower.includes('recurring') ||
      catLower.includes('membership') ||
      catLower.includes('renewal') ||
      catLower.includes('saas') ||
      catLower.includes('software')
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('repeat') || CATEGORY_ICON_MAP.get('cloud')!)
    }

    // Internet, WiFi & Broadband (Checked before internship)
    if (
      catLower.includes('wifi') ||
      catLower.includes('internet') ||
      catLower.includes('broadband') ||
      catLower.includes('fibernet') ||
      catLower.includes('mobile recharge')
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('wifi')!)
    }

    // Internship, Stipends & Training
    if (
      !catLower.includes('internet') &&
      (/\b(intern|internship|internships|stipend|stipends|trainee|apprentice)\b/i.test(catLower) ||
        catLower.includes('internship') ||
        catLower.includes('stipend'))
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('graduation-cap')!)
    }

    // IPO, Stocks, Equities & Trading
    if (
      catLower.includes('ipo') ||
      catLower.includes('stock') ||
      catLower.includes('equity') ||
      catLower.includes('share') ||
      catLower.includes('demat') ||
      catLower.includes('trading') ||
      catLower.includes('allotment')
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('candlestick')!)
    }

    // Refunds, Cashback, Reimbursements & Reversals
    if (
      catLower.includes('refund') ||
      catLower.includes('cashback') ||
      catLower.includes('reimburse') ||
      catLower.includes('rebate') ||
      catLower.includes('chargeback') ||
      catLower.includes('reversal') ||
      catLower.includes('moneyback')
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('rotate-ccw')!)
    }

    // Income Specific Heuristics
    if (isIncome || catLower.includes('income')) {
      if (catLower.includes('salary') || catLower.includes('payroll') || catLower.includes('wages') || catLower.includes('paycheck') || catLower.includes('job') || catLower.includes('ctc')) {
        return toVisual(CATEGORY_ICON_MAP.get('briefcase')!)
      }
      if (catLower.includes('business') || catLower.includes('corporate') || catLower.includes('agency')) {
        return toVisual(CATEGORY_ICON_MAP.get('briefcase-biz')!)
      }
      if (catLower.includes('freelance') || catLower.includes('consulting') || catLower.includes('client') || catLower.includes('contract') || catLower.includes('gig')) {
        return toVisual(CATEGORY_ICON_MAP.get('code')!)
      }
      if (catLower.includes('dividend') || catLower.includes('interest') || catLower.includes('fd') || catLower.includes('yield') || catLower.includes('payout')) {
        return toVisual(CATEGORY_ICON_MAP.get('badge-percent')!)
      }
      if (catLower.includes('bonus') || catLower.includes('appraisal') || catLower.includes('incentive') || catLower.includes('reward')) {
        return toVisual(CATEGORY_ICON_MAP.get('award')!)
      }
      if (catLower.includes('rent') || catLower.includes('tenant') || catLower.includes('property income')) {
        return toVisual(CATEGORY_ICON_MAP.get('building')!)
      }
      if (catLower.includes('invest') || catLower.includes('capital gain') || catLower.includes('profit') || catLower.includes('mutual fund')) {
        return toVisual(CATEGORY_ICON_MAP.get('trending-up')!)
      }
      if (catLower.includes('gift') || catLower.includes('donation') || catLower.includes('inheritance')) {
        return toVisual(CATEGORY_ICON_MAP.get('gift')!)
      }
      if (catLower.includes('crypto') || catLower.includes('bitcoin')) {
        return toVisual(CATEGORY_ICON_MAP.get('coins')!)
      }
      if (isSpecificCategory) {
        return toVisual(CATEGORY_ICON_MAP.get('badge-rupee')!)
      }
    }

    // Food & Dining
    if (catLower.includes('coffee') || catLower.includes('cafe') || catLower.includes('tea') || catLower.includes('chai')) {
      return toVisual(CATEGORY_ICON_MAP.get('coffee')!)
    }
    if (catLower.includes('grocery') || catLower.includes('groceries') || catLower.includes('supermarket') || catLower.includes('vegetable') || catLower.includes('fruit')) {
      return toVisual(CATEGORY_ICON_MAP.get('groceries')!)
    }
    if (catLower.includes('restaurant') || catLower.includes('dining') || catLower.includes('dinner') || catLower.includes('lunch') || catLower.includes('food') || catLower.includes('meal')) {
      return toVisual(CATEGORY_ICON_MAP.get('utensils')!)
    }
    if (catLower.includes('pizza') || catLower.includes('burger') || catLower.includes('fast food') || catLower.includes('snack')) {
      return toVisual(CATEGORY_ICON_MAP.get('pizza')!)
    }
    if (catLower.includes('bakery') || catLower.includes('cake') || catLower.includes('sweet') || catLower.includes('dessert')) {
      return toVisual(CATEGORY_ICON_MAP.get('cake')!)
    }
    if (
      catLower.includes('wine') ||
      catLower.includes('beer') ||
      catLower.includes('alcohol') ||
      catLower.includes('liquor') ||
      (/\b(pub|pubs)\b/i.test(catLower) && !catLower.includes('public') && !catLower.includes('publish')) ||
      (/\b(bar|bars|cocktail|cocktails|lounge|brewery)\b/i.test(catLower) && !catLower.includes('barber'))
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('wine')!)
    }

    // Travel & Transport
    if (catLower.includes('petrol') || catLower.includes('fuel') || catLower.includes('diesel') || catLower.includes('gas station') || catLower.includes('cng')) {
      return toVisual(CATEGORY_ICON_MAP.get('fuel')!)
    }
    if (catLower.includes('flight') || catLower.includes('airline') || catLower.includes('airport') || catLower.includes('aviation') || catLower.includes('plane')) {
      return toVisual(CATEGORY_ICON_MAP.get('plane')!)
    }
    if (catLower.includes('train') || catLower.includes('metro') || catLower.includes('rail') || catLower.includes('irctc')) {
      return toVisual(CATEGORY_ICON_MAP.get('train')!)
    }
    if (catLower.includes('hotel') || catLower.includes('resort') || catLower.includes('stay') || catLower.includes('accommodation') || catLower.includes('vacation')) {
      return toVisual(CATEGORY_ICON_MAP.get('luggage')!)
    }
    if (/\b(bus|buses|shuttle|shuttles)\b/i.test(catLower) && !catLower.includes('business')) {
      return toVisual(CATEGORY_ICON_MAP.get('bus')!)
    }
    if (catLower.includes('bike') || catLower.includes('motorcycle') || catLower.includes('scooter') || catLower.includes('two wheeler')) {
      return toVisual(CATEGORY_ICON_MAP.get('bike')!)
    }
    if (
      catLower.includes('transport') ||
      catLower.includes('travel') ||
      catLower.includes('taxi') ||
      catLower.includes('cab') ||
      catLower.includes('uber') ||
      catLower.includes('ola') ||
      catLower.includes('auto') ||
      (/\b(car|cars)\b/i.test(catLower) && !catLower.includes('care') && !catLower.includes('career'))
    ) {
      return toVisual(CATEGORY_ICON_MAP.get('car')!)
    }

    // Entertainment & Media
    if (catLower.includes('music') || catLower.includes('audio') || catLower.includes('song') || catLower.includes('spotify')) {
      return toVisual(CATEGORY_ICON_MAP.get('music')!)
    }
    if (catLower.includes('game') || catLower.includes('gaming') || catLower.includes('playstation') || catLower.includes('xbox')) {
      return toVisual(CATEGORY_ICON_MAP.get('gamepad')!)
    }
    if (catLower.includes('movie') || catLower.includes('cinema') || catLower.includes('theatre') || catLower.includes('ott') || catLower.includes('netflix')) {
      return toVisual(CATEGORY_ICON_MAP.get('film')!)
    }
    if (catLower.includes('entertain') || catLower.includes('event') || catLower.includes('concert') || catLower.includes('show')) {
      return toVisual(CATEGORY_ICON_MAP.get('ticket')!)
    }

    // Shopping & Personal Care
    if (catLower.includes('salon') || catLower.includes('beauty') || catLower.includes('barber') || catLower.includes('hair') || catLower.includes('spa') || catLower.includes('skincare') || catLower.includes('grooming')) {
      return toVisual(CATEGORY_ICON_MAP.get('scissors')!)
    }
    if (catLower.includes('cloth') || catLower.includes('apparel') || catLower.includes('wear') || catLower.includes('fashion') || catLower.includes('shirt')) {
      return toVisual(CATEGORY_ICON_MAP.get('shirt')!)
    }
    if (catLower.includes('shoe') || catLower.includes('footwear') || catLower.includes('sneaker')) {
      return toVisual(CATEGORY_ICON_MAP.get('footprints')!)
    }
    if (catLower.includes('watch') || catLower.includes('jewel') || catLower.includes('gold') || catLower.includes('silver')) {
      return toVisual(CATEGORY_ICON_MAP.get('gem')!)
    }
    if (catLower.includes('electr') && (catLower.includes('gadget') || catLower.includes('device') || catLower.includes('tech') || catLower.includes('mobile'))) {
      return toVisual(CATEGORY_ICON_MAP.get('smartphone')!)
    }
    if (catLower.includes('shop') || catLower.includes('store') || catLower.includes('mall') || catLower.includes('order')) {
      return toVisual(CATEGORY_ICON_MAP.get('shopping-bag')!)
    }

    // Health & Medical
    if (catLower.includes('medicin') || catLower.includes('pharmacy') || catLower.includes('drug') || catLower.includes('pill') || catLower.includes('supplement')) {
      return toVisual(CATEGORY_ICON_MAP.get('pill')!)
    }
    if (catLower.includes('gym') || catLower.includes('workout') || catLower.includes('fitness') || catLower.includes('crossfit') || catLower.includes('yoga')) {
      return toVisual(CATEGORY_ICON_MAP.get('dumbbell')!)
    }
    if (catLower.includes('health') || catLower.includes('doctor') || catLower.includes('clinic') || catLower.includes('hospital') || catLower.includes('consult')) {
      return toVisual(CATEGORY_ICON_MAP.get('heart-pulse')!)
    }

    // Home & Utilities
    if (catLower.includes('rent') || catLower.includes('mortgage') || catLower.includes('lease')) {
      return toVisual(CATEGORY_ICON_MAP.get('home')!)
    }
    if (catLower.includes('society') || catLower.includes('maint') || catLower.includes('domestic') || catLower.includes('maid') || catLower.includes('flat')) {
      return toVisual(CATEGORY_ICON_MAP.get('building-2')!)
    }
    if (catLower.includes('elec') || catLower.includes('power') || catLower.includes('current')) {
      return toVisual(CATEGORY_ICON_MAP.get('zap')!)
    }
    if (catLower.includes('water')) {
      return toVisual(CATEGORY_ICON_MAP.get('droplets')!)
    }
    if (catLower.includes('gas') || catLower.includes('lpg') || catLower.includes('cylinder')) {
      return toVisual(CATEGORY_ICON_MAP.get('flame')!)
    }
    if (catLower.includes('repair') || catLower.includes('plumb') || catLower.includes('carpenter') || catLower.includes('appliance')) {
      return toVisual(CATEGORY_ICON_MAP.get('wrench')!)
    }
    if (catLower.includes('furniture') || catLower.includes('decor')) {
      return toVisual(CATEGORY_ICON_MAP.get('sofa')!)
    }
    if (catLower.includes('bill') || catLower.includes('utility') || catLower.includes('utilities')) {
      return toVisual(CATEGORY_ICON_MAP.get('receipt')!)
    }

    // Education & Books
    if (catLower.includes('book') || catLower.includes('course') || catLower.includes('read') || catLower.includes('learning')) {
      return toVisual(CATEGORY_ICON_MAP.get('book-open')!)
    }
    if (catLower.includes('school') || catLower.includes('college') || catLower.includes('tuition') || catLower.includes('education') || catLower.includes('academy')) {
      return toVisual(CATEGORY_ICON_MAP.get('school')!)
    }

    // Finance & Investments
    if (catLower.includes('invest') || catLower.includes('sip') || catLower.includes('mutual') || catLower.includes('fund') || catLower.includes('crypto')) {
      return toVisual(CATEGORY_ICON_MAP.get('trending-up')!)
    }
    if (catLower.includes('deposit') || catLower.includes('bank') || catLower.includes('tax') || catLower.includes('gst')) {
      return toVisual(CATEGORY_ICON_MAP.get('landmark')!)
    }
    if (catLower.includes('insurance') || catLower.includes('policy')) {
      return toVisual(CATEGORY_ICON_MAP.get('shield-check')!)
    }
    if (catLower.includes('loan') || catLower.includes('emi') || catLower.includes('credit card')) {
      return toVisual(CATEGORY_ICON_MAP.get('credit-card')!)
    }

    // Personal & Family
    if (catLower.includes('personal')) {
      return toVisual(CATEGORY_ICON_MAP.get('bookmark') || CATEGORY_ICON_MAP.get('layers')!)
    }
    if (catLower.includes('general')) {
      return toVisual(CATEGORY_ICON_MAP.get('layers')!)
    }
    if (catLower.includes('charity') || catLower.includes('temple') || catLower.includes('donat') || catLower.includes('gurudwara') || catLower.includes('trust')) {
      return toVisual(CATEGORY_ICON_MAP.get('heart')!)
    }
    if (/\b(pet|pets|dog|dogs|cat|cats|puppy|kitten|vet|veterinary)\b/i.test(catLower) && !catLower.includes('carpet')) {
      return toVisual(CATEGORY_ICON_MAP.get('paw-print')!)
    }
    if (catLower.includes('baby') || catLower.includes('childcare') || catLower.includes('daycare') || catLower.includes('kid')) {
      return toVisual(CATEGORY_ICON_MAP.get('baby')!)
    }
    if (catLower.includes('gift')) {
      return toVisual(CATEGORY_ICON_MAP.get('gift')!)
    }

    // ─── C. Category Keywords Scan across Catalog ───
    for (const meta of CATEGORY_ICON_CATALOG) {
      if (meta.keywords && meta.keywords.some(kw => catLower.includes(kw.toLowerCase()))) {
        return toVisual(meta)
      }
    }
  }

  // 3. Fallback: If category is empty or generic (Other/General), check Title/Merchant keywords
  if (titleLower) {
    if (titleLower.includes('spotify') || titleLower.includes('apple music') || titleLower.includes('gaana') || titleLower.includes('wynk') || titleLower.includes('soundcloud') || titleLower.includes('music')) {
      return toVisual(CATEGORY_ICON_MAP.get('music')!)
    }
    if (titleLower.includes('netflix') || titleLower.includes('prime video') || titleLower.includes('disney') || titleLower.includes('hotstar') || titleLower.includes('hbo') || titleLower.includes('cinema') || titleLower.includes('movie') || titleLower.includes('pvr') || titleLower.includes('inox')) {
      return toVisual(CATEGORY_ICON_MAP.get('film')!)
    }
    if (titleLower.includes('youtube') || titleLower.includes('twitch') || titleLower.includes('television')) {
      return toVisual(CATEGORY_ICON_MAP.get('tv')!)
    }
    if (titleLower.includes('steam') || titleLower.includes('playstation') || titleLower.includes('xbox') || titleLower.includes('nintendo') || titleLower.includes('epic games') || titleLower.includes('game')) {
      return toVisual(CATEGORY_ICON_MAP.get('gamepad')!)
    }
    if (titleLower.includes('gym') || titleLower.includes('cult') || titleLower.includes('fitness') || titleLower.includes('workout') || titleLower.includes('yoga') || titleLower.includes('crossfit')) {
      return toVisual(CATEGORY_ICON_MAP.get('dumbbell')!)
    }
    if (titleLower.includes('starbucks') || titleLower.includes('cafe') || titleLower.includes('coffee') || titleLower.includes('blue tokai') || titleLower.includes('third wave') || titleLower.includes('chai') || titleLower.includes('tea')) {
      return toVisual(CATEGORY_ICON_MAP.get('coffee')!)
    }
    if (titleLower.includes('pizza') || titleLower.includes('domino') || titleLower.includes('burger') || titleLower.includes('mcdonald') || titleLower.includes('kfc') || titleLower.includes('subway') || titleLower.includes('swiggy') || titleLower.includes('zomato')) {
      return toVisual(CATEGORY_ICON_MAP.get('pizza')!)
    }
    if (titleLower.includes('blinkit') || titleLower.includes('instamart') || titleLower.includes('zepto') || titleLower.includes('bigbasket') || titleLower.includes('grocery') || titleLower.includes('supermarket')) {
      return toVisual(CATEGORY_ICON_MAP.get('groceries')!)
    }
    if (titleLower.includes('uber') || titleLower.includes('ola') || titleLower.includes('rapido') || titleLower.includes('taxi') || titleLower.includes('cab') || titleLower.includes('auto')) {
      return toVisual(CATEGORY_ICON_MAP.get('car')!)
    }
    if (titleLower.includes('flight') || titleLower.includes('indigo') || titleLower.includes('air india') || titleLower.includes('vistara') || titleLower.includes('emirates') || titleLower.includes('airline') || titleLower.includes('airport')) {
      return toVisual(CATEGORY_ICON_MAP.get('plane')!)
    }
    if (titleLower.includes('irctc') || titleLower.includes('train') || titleLower.includes('metro') || titleLower.includes('railway')) {
      return toVisual(CATEGORY_ICON_MAP.get('train')!)
    }
    if (titleLower.includes('petrol') || titleLower.includes('fuel') || titleLower.includes('diesel') || titleLower.includes('cng') || titleLower.includes('shell') || titleLower.includes('hpcl') || titleLower.includes('bpcl') || titleLower.includes('ioc')) {
      return toVisual(CATEGORY_ICON_MAP.get('fuel')!)
    }
    if (titleLower.includes('icloud') || titleLower.includes('aws') || titleLower.includes('github') || titleLower.includes('google drive') || titleLower.includes('chatgpt') || titleLower.includes('openai') || titleLower.includes('cursor') || titleLower.includes('figma') || titleLower.includes('adobe') || titleLower.includes('notion')) {
      return toVisual(CATEGORY_ICON_MAP.get('cloud')!)
    }
    if (titleLower.includes('jio') || titleLower.includes('airtel') || titleLower.includes('vodafone') || titleLower.includes('broadband') || titleLower.includes('mobile recharge') || titleLower.includes('wifi')) {
      return toVisual(CATEGORY_ICON_MAP.get('wifi')!)
    }
    if (titleLower.includes('pharmacy') || titleLower.includes('apollo') || titleLower.includes('1mg') || titleLower.includes('pharmeasy') || titleLower.includes('medicine') || titleLower.includes('doctor') || titleLower.includes('clinic')) {
      return toVisual(CATEGORY_ICON_MAP.get('pill')!)
    }
    if (titleLower.includes('salon') || titleLower.includes('spa') || titleLower.includes('haircut') || titleLower.includes('parlour') || titleLower.includes('barber')) {
      return toVisual(CATEGORY_ICON_MAP.get('scissors')!)
    }
    if (titleLower.includes('pet') || titleLower.includes('vet') || titleLower.includes('dog') || titleLower.includes('cat')) {
      return toVisual(CATEGORY_ICON_MAP.get('paw-print')!)
    }
  }

  // 4. Deterministic Dynamic Fallback Hashing for novel custom category names
  if (cat) {
    const paletteIndex = hashStringToPaletteIndex(cat)
    const p = DYNAMIC_FALLBACK_PALETTES[paletteIndex]
    return {
      id: p.id,
      label: cat,
      icon: p.icon,
      colorClass: p.colorClass,
      bgClass: p.bgClass,
      borderClass: p.borderClass,
      bg: `${p.bgClass} ${p.colorClass} border ${p.borderClass}`
    }
  }

  // 5. Default ultimate fallback
  if (isIncome) {
    return toVisual(CATEGORY_ICON_MAP.get('badge-rupee')!)
  }
  const fallback = CATEGORY_ICON_MAP.get('tag')!
  return toVisual(fallback)
}
