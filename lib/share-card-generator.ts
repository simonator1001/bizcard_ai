/**
 * Share Card Generator — generates a branded BizCard AI template image
 * for viral sharing via WhatsApp, Email, Download, etc.
 * 
 * Uses HTML5 Canvas (client-side only — no server dependency).
 */

import type { BusinessCard } from '@/types/business-card'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1350
const CARD_PADDING = 60
const CARD_WIDTH = CANVAS_WIDTH - CARD_PADDING * 2
const CARD_Y = 160
const APP_URL = 'https://simon-gpt.com'

interface ShareCardOptions {
  card: BusinessCard
  userId?: string
}

/**
 * Load an image from a URL into an HTMLImageElement.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

/**
 * Round a rectangle path on the canvas context.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Draw a gradient-filled rounded rectangle.
 */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient
) {
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

/**
 * Generate the branded share card image as a data URL.
 */
export async function generateShareCardImage(
  options: ShareCardOptions
): Promise<string> {
  const { card, userId } = options
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!
  const cx = CANVAS_WIDTH / 2

  // ── 1. Background gradient (indigo → violet → purple) ──
  const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  bgGrad.addColorStop(0, '#4f46e5') // indigo-600
  bgGrad.addColorStop(0.5, '#7c3aed') // violet-600
  bgGrad.addColorStop(1, '#9333ea') // purple-600
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Decorative blobs
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.beginPath()
  ctx.arc(100, 100, 200, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 120, 250, 0, Math.PI * 2)
  ctx.fill()

  // ── 2. White card background ──
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 8
  fillRoundRect(ctx, CARD_PADDING, CARD_Y, CARD_WIDTH, 1020, 28, '#ffffff')
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // ── 3. Avatar / Photo ──
  const avatarY = CARD_Y + 70
  const avatarSize = 160
  const avatarX = cx - avatarSize / 2

  // Avatar circle
  ctx.beginPath()
  ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2)
  ctx.fillStyle = '#e0e7ff' // indigo-100
  ctx.fill()

  const photoUrl = card.image_url
  let hasPhoto = false
  if (photoUrl) {
    try {
      const img = await loadImage(photoUrl)
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
      ctx.restore()
      hasPhoto = true
    } catch {
      // fall through to initials
    }
  }

  if (!hasPhoto) {
    // Initials fallback
    const initials = getInitials(card.name || '?')
    ctx.beginPath()
    ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    const avatarBgGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize)
    avatarBgGrad.addColorStop(0, '#6366f1')
    avatarBgGrad.addColorStop(1, '#8b5cf6')
    ctx.fillStyle = avatarBgGrad
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, cx, avatarY + avatarSize / 2 + 4)
  }

  // ── 4. Name, Title, Company ──
  let textY = avatarY + avatarSize + 50

  // Name
  ctx.textAlign = 'center'
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
  const name = card.name || ''
  ctx.fillText(fitText(ctx, name, CARD_WIDTH - 80), cx, textY)
  textY += 56

  // Title
  if (card.title) {
    ctx.fillStyle = '#4f46e5'
    ctx.font = '500 30px system-ui, -apple-system, sans-serif'
    ctx.fillText(fitText(ctx, card.title, CARD_WIDTH - 80), cx, textY)
    textY += 42
  }

  // Company
  if (card.company) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '24px system-ui, -apple-system, sans-serif'
    ctx.fillText(fitText(ctx, card.company, CARD_WIDTH - 80), cx, textY)
    textY += 50
  }

  // Divider line
  textY += 10
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CARD_PADDING + 60, textY)
  ctx.lineTo(CARD_WIDTH + CARD_PADDING - 60, textY)
  ctx.stroke()
  textY += 40

  // ── 5. Contact Info ──
  const infoX = CARD_PADDING + 80
  const iconSize = 36

  function drawContactRow(icon: string, label: string, value: string, color: string) {
    if (!value) return
    // Icon circle
    ctx.beginPath()
    ctx.arc(infoX + 28, textY + 22, 22, 0, Math.PI * 2)
    ctx.fillStyle = color + '1a' // 10% opacity
    ctx.fill()
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, infoX + 28, textY + 23)

    // Label
    ctx.textAlign = 'left'
    ctx.fillStyle = '#9ca3af'
    ctx.font = '18px system-ui, -apple-system, sans-serif'
    ctx.fillText(label, infoX + 64, textY + 9)

    // Value
    ctx.fillStyle = '#374151'
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.fillText(fitText(ctx, value, CARD_WIDTH - 200), infoX + 64, textY + 35)

    textY += 56
  }

  drawContactRow('✉', 'Email', card.email || '', '#6366f1')
  drawContactRow('📞', 'Phone', card.phone || '', '#22c55e')
  if (card.address) {
    drawContactRow('📍', 'Address', card.address, '#f59e0b')
  }

  // ── 6. QR Code ──
  const qrY = CARD_Y + 1020 - 220
  const qrSize = 140
  const qrX = CARD_PADDING + 60

  // QR label
  ctx.fillStyle = '#9ca3af'
  ctx.font = '16px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Scan to save', qrX, qrY - 12)

  // QR code image
  const shareUrl = userId 
    ? `${APP_URL}/share/${userId}`
    : APP_URL
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=4f46e5&margin=10`

  try {
    const qrImg = await loadImage(qrApiUrl)
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
  } catch {
    // QR fallback — just show the URL text
    ctx.fillStyle = '#4f46e5'
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.fillText(APP_URL, qrX, qrY + qrSize / 2)
  }

  // ── 7. Right side: Brand name + CTA ──
  const ctaX = qrX + qrSize + 40
  const ctaW = CARD_WIDTH - qrSize - 120
  const ctaY = qrY + 10

  // "Powered by" label
  ctx.fillStyle = '#9ca3af'
  ctx.font = '16px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Powered by', ctaX, ctaY + 20)

  // BizCard AI brand
  ctx.fillStyle = '#4f46e5'
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.fillText('BizCard AI', ctaX, ctaY + 58)

  // CTA text
  ctx.fillStyle = '#374151'
  ctx.font = '20px system-ui, -apple-system, sans-serif'
  ctx.fillText('Get your free', ctaX, ctaY + 88)
  ctx.fillText('digital card today!', ctaX, ctaY + 114)

  // URL
  ctx.fillStyle = '#6366f1'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText('simon-gpt.com', ctaX, ctaY + 145)

  // ── 8. Bottom tagline ──
  const footerY = CANVAS_HEIGHT - 50
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '18px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('📇 Digital Business Cards made simple · BizCard AI', cx, footerY)

  // Return as PNG data URL
  return canvas.toDataURL('image/png')
}

/**
 * Get 1-2 character initials from a name.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (parts[0]?.[0] || '?').toUpperCase()
}

/**
 * Fit text within a max width by truncating with ellipsis if needed.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '…'
}

/**
 * Convert a data URL to a Blob (for sharing/download).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(parts[1])
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}
