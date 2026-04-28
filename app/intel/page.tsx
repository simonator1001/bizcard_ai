'use client'

import { useState, useEffect } from 'react'

interface NewsItem {
  id: string
  headline: string
  source: string
  timeAgo: string
  summary: string
  category: string
  isBreaking: boolean
  url?: string
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    headline: 'United Arab Emirates says it will leave OPEC',
    source: 'ABC News',
    timeAgo: '36min',
    summary: 'The move comes amid regional fallout from the Iran war.',
    category: 'Global',
    isBreaking: true,
  },
  {
    id: '2',
    headline: 'UAE leaves OPEC and OPEC+\nUAE withdraws from OPEC May 2026',
    source: 'Google News',
    timeAgo: '36min',
    summary: 'Top Stories coverage of the major oil policy shift.',
    category: 'Global',
    isBreaking: true,
  },
  {
    id: '3',
    headline: '玩家手多!! 幫顯示卡換散熱膏鎖螺絲太大力直接刺穿PCB導致短路',
    source: 'HKEPC Hardware',
    timeAgo: '58min',
    summary: '【大力出奇蹟】If it works, don\'t touch it!! 國外知名的維修頻道《Northwest Repair》分享了一宗令人震驚的維修案例。',
    category: 'Tech',
    isBreaking: false,
  },
  {
    id: '4',
    headline: "McDonald's 點餐 AI 變寫 Code 專家 免費代寫 Python 兼點餐「不用再花錢買 Claude」",
    source: 'unwire.hk',
    timeAgo: '1h',
    summary: "美國 McDonald's 近日推出 AI 客服機械人 Grimace，原本目標是處理點餐及訂單問題，卻因有用戶要求它解答 Python 程式題，令對話截圖在 X 迅速爆紅。",
    category: 'Tech/AI',
    isBreaking: false,
  },
  {
    id: '5',
    headline: '騰訊發布新一代混元大模型 性能全面超越 GPT-4',
    source: 'SCMP',
    timeAgo: '2h',
    summary: '騰訊混元團隊宣布最新 AI 模型在多項基準測試中取得領先地位，特別在中文理解和生成方面表現突出。',
    category: 'Tencent',
    isBreaking: false,
  },
  {
    id: '6',
    headline: '香港金管局推出數碼港元第二階段試點計劃',
    source: 'HK01',
    timeAgo: '3h',
    summary: '金管局宣布擴大數碼港元試點範圍，涵蓋更多零售支付場景及跨境支付應用。',
    category: 'Payments/HK',
    isBreaking: false,
  },
  {
    id: '7',
    headline: 'Bloomberg: Bitcoin Surges Past $150K as Institutional Adoption Accelerates',
    source: 'Bloomberg',
    timeAgo: '4h',
    summary: 'Institutional inflows into Bitcoin ETFs reach new all-time highs as traditional finance embraces digital assets.',
    category: 'Web3',
    isBreaking: false,
  },
]

const categoryColors: Record<string, string> = {
  'Global': 'bg-blue-100 text-blue-700',
  'Tech': 'bg-purple-100 text-purple-700',
  'Tech/AI': 'bg-indigo-100 text-indigo-700',
  'Tencent': 'bg-emerald-100 text-emerald-700',
  'Payments/HK': 'bg-amber-100 text-amber-700',
  'Web3': 'bg-orange-100 text-orange-700',
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
      {/* Breaking badge */}
      {item.isBreaking && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            BREAKING NEWS
          </span>
        </div>
      )}

      {/* Category badge */}
      <div className="mb-2">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
          {item.category}
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-[15px] font-semibold leading-snug text-gray-900 mb-1.5">
        {item.headline}
      </h3>

      {/* Source + Time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500">{item.source}</span>
        <span className="text-[11px] text-gray-400">/ {item.timeAgo}</span>
      </div>

      {/* Summary */}
      <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
        {item.summary}
      </p>
    </div>
  )
}

export default function IntelPage() {
  const [news, setNews] = useState<NewsItem[]>(mockNews)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...new Set(news.map(n => n.category))]

  const filteredNews = activeCategory === 'all' 
    ? news 
    : news.filter(n => n.category === activeCategory)

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Status bar */}
      <div className="sticky top-0 z-50 bg-[#f5f5f7]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-sm font-semibold text-gray-900">9:58</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">5G</span>
            <span className="text-xs font-medium text-gray-900">57%</span>
          </div>
        </div>

        {/* Today header */}
        <div className="px-5 pt-2 pb-3">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Today</h1>
          <p className="text-xs text-gray-400 mt-0.5">BD Intel · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Category filter pills */}
        <div className="px-5 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News feed */}
      <div className="px-4 pb-20 space-y-3">
        {filteredNews.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* Bottom nav placeholder */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
            <span className="text-[10px] font-medium text-gray-900">Feed</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
            <span className="text-[10px] text-gray-400">Search</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[10px] text-gray-400">Saved</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
            <span className="text-[10px] text-gray-400">Alerts</span>
          </button>
        </div>
      </div>
    </div>
  )
}
