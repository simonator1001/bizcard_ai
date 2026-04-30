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

export const convertToVCard = (card: BusinessCard) => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name || card.name_zh || ''}`,
    card.name && `N:${card.name};;;;`,
    card.name_zh && `X-PHONETIC-LAST-NAME:${card.name_zh}`,
    card.title && `TITLE:${card.title}`,
    card.company && `ORG:${card.company}`,
    card.email && `EMAIL:${card.email}`,
    card.phone && `TEL:${card.phone}`,
    card.address && `ADR:;;${card.address};;;;`,
    card.notes && `NOTE:${card.notes}`,
    'END:VCARD'
  ].filter(Boolean).join('\n')
  return lines
}

export const downloadVCard = (card: BusinessCard) => {
  const vcf = convertToVCard(card)
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  const name = (card.name || card.name_zh || 'contact').replace(/\s+/g, '_')
  link.setAttribute('href', url)
  link.setAttribute('download', `${name}.vcf`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const downloadAllVCards = (cards: BusinessCard[]) => {
  const allVcf = cards.map(c => convertToVCard(c)).join('\n\n')
  const blob = new Blob([allVcf], { type: 'text/vcard;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `business_cards_${new Date().toISOString().split('T')[0]}.vcf`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 