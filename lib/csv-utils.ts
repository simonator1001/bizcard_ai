import { BusinessCard } from '@/types/business-card'

export const convertToCSV = (cards: BusinessCard[]) => {
  // Define CSV headers
  const headers = [
    'Name (English)',
    'Name (Chinese)',
    'Title (English)',
    'Title (Chinese)',
    'Company (English)',
    'Company (Chinese)',
    'Email',
    'Phone',
    'Mobile',
    'Address (English)',
    'Address (Chinese)',
    'Department (English)',
    'Department (Chinese)',
    'WeChat',
    'WhatsApp',
    'Line',
    'Telegram',
    'LinkedIn',
    'Facebook',
    'Twitter',
    'Instagram',
    'Website',
    'Date Added'
  ].join(',')

  // Convert each card to CSV row
  const rows = cards.map(card => [
    `"${card.name || ''}"`,
    `"${card.nameZh || ''}"`,
    `"${card.title || ''}"`,
    `"${card.titleZh || ''}"`,
    `"${card.company || ''}"`,
    `"${card.companyZh || ''}"`,
    `"${card.email || ''}"`,
    `"${card.phone || ''}"`,
    `"${card.mobile || ''}"`,
    `"${card.address || ''}"`,
    `"${card.addressZh || ''}"`,
    `"${card.department || ''}"`,
    `"${card.departmentZh || ''}"`,
    `"${card.wechat || ''}"`,
    `"${card.whatsapp || ''}"`,
    `"${card.line || ''}"`,
    `"${card.telegram || ''}"`,
    `"${card.linkedin || ''}"`,
    `"${card.facebook || ''}"`,
    `"${card.twitter || ''}"`,
    `"${card.instagram || ''}"`,
    `"${card.website || ''}"`,
    `"${card.dateAdded || ''}"`,
  ].join(','))

  return [headers, ...rows].join('\n')
}

export const downloadCSV = (cards: BusinessCard[]) => {
  const csv = convertToCSV(cards)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `business_cards_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 