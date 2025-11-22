import { BusinessCard } from '@/types/business-card'

export const convertToCSV = (cards: BusinessCard[]) => {
  // Define CSV headers
  const headers = [
    'Name',
    'Name (Chinese)',
    'Title',
    'Title (Chinese)',
    'Company',
    'Company (Chinese)',
    'Email',
    'Phone',
    'Address',
    'Address (Chinese)',
    'Image URL',
    'Notes',
    'Date Added',
    'Last Modified'
  ].join(',')

  // Convert each card to CSV row
  const rows = cards.map(card => [
    `"${card.name || ''}"`,
    `"${card.name_zh || ''}"`,
    `"${card.title || ''}"`,
    `"${card.title_zh || ''}"`,
    `"${card.company || ''}"`,
    `"${card.company_zh || ''}"`,
    `"${card.email || ''}"`,
    `"${card.phone || ''}"`,
    `"${card.address || ''}"`,
    `"${card.address_zh || ''}"`,
    `"${card.image_url || ''}"`,
    `"${card.notes || ''}"`,
    `"${card.created_at || ''}"`,
    `"${card.lastModified || ''}"`,
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