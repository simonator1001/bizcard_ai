import { BusinessCard } from '@/types/business-card'

export const convertToCSV = (cards: BusinessCard[]) => {
  // Define CSV headers
  const headers = [
    'Name',
    'Position',
    'Title',
    'Title (Chinese)',
    'Company',
    'Email',
    'Phone',
    'Reports To',
    'Image URL',
    'Date Added'
  ].join(',')

  // Convert each card to CSV row
  const rows = cards.map(card => [
    `"${card.name || ''}"`,
    `"${card.position || ''}"`,
    `"${card.title || ''}"`,
    `"${card.titleZh || ''}"`,
    `"${card.company || ''}"`,
    `"${card.companyZh || ''}"`,
    `"${card.email || ''}"`,
    `"${card.phone || ''}"`,
    `"${card.mobile || ''}"`,
    `"${card.fax || ''}"`,
    `"${card.wechat || ''}"`,
    `"${card.instagram || ''}"`,
    `"${card.linkedin || ''}"`,
    `"${card.website || ''}"`,
    `"${card.address || ''}"`,
    `"${card.addressZh || ''}"`,
    `"${card.department || ''}"`,
    `"${card.departmentZh || ''}"`,
    `"${card.whatsapp || ''}"`,
    `"${card.line || ''}"`,
    `"${card.telegram || ''}"`,
    `"${card.facebook || ''}"`,
    `"${card.twitter || ''}"`,
    `"${card.imageUrl || ''}"`,
    `"${card.notes || ''}"`,
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