/**
 * Social Share URL generators for all major platforms.
 * Used by ShareDialog, CardDetailView, and the share page.
 */

const APP_URL = 'https://simon-gpt.com'

export interface ShareContent {
  name: string
  title?: string
  company?: string
  shareUrl: string
  brandedText: string  // viral copy for text-based shares
}

/**
 * Build branded share content from card data.
 */
export function buildShareContent(
  card: { name?: string; title?: string; company?: string },
  userId?: string,
  origin?: string
): ShareContent {
  const name = card.name || 'Someone'
  const shareUrl = userId 
    ? `${origin || APP_URL}/share/${userId}`
    : APP_URL
  const brandedText = [
    `📇 ${name}'s Digital Business Card`,
    card.title ? `💼 ${card.title}${card.company ? ` at ${card.company}` : ''}` : '',
    '',
    `🔗 ${shareUrl}`,
    '',
    '✨ Create your free digital card at simon-gpt.com',
  ].filter(Boolean).join('\n')
  
  return { name, title: card.title, company: card.company, shareUrl, brandedText }
}

// ── Platform URL generators ──

export function linkedInShareUrl(shareUrl: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
}

export function facebookShareUrl(shareUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
}

export function twitterShareUrl(text: string, shareUrl: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
}

export function lineShareUrl(text: string) {
  // Use standard URL scheme
  const encoded = encodeURIComponent(text.trim())
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    return `https://line.me/R/msg/text/?${encoded}`
  }
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(APP_URL)}`
}

export function kakaoTalkShareUrl(shareUrl: string, text: string) {
  return `https://kakaotalk.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
}

export function wechatQrUrl(shareUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=07c160`
}

export function smsShareUrl(phone: string, text: string) {
  return `sms:${phone ? phone : ''}?&body=${encodeURIComponent(text)}`
}

export function instagramShareUrl() {
  // Instagram doesn't support URL-based sharing from web. 
  // Best we can do is copy link + open Instagram.
  return null // signal: use copy-to-clipboard + open app
}

// ── Combined share handler ──

export type SharePlatform = 
  | 'whatsapp' | 'email' | 'linkedin' | 'facebook' 
  | 'twitter' | 'line' | 'kakaotalk' | 'wechat' 
  | 'sms' | 'instagram' | 'copy'

export interface ShareAction {
  platform: SharePlatform
  label: string
  icon: string // emoji
  url?: string
  action?: 'open' | 'copy' | 'dialog'
}

export function getShareActions(content: ShareContent, phone?: string): ShareAction[] {
  return [
    { platform: 'whatsapp', label: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(content.brandedText)}`, action: 'open' },
    { platform: 'email', label: 'Email', icon: '📧', url: `mailto:?subject=${encodeURIComponent(`${content.name}'s Digital Card`)}&body=${encodeURIComponent(content.brandedText)}`, action: 'open' },
    { platform: 'linkedin', label: 'LinkedIn', icon: '💼', url: linkedInShareUrl(content.shareUrl), action: 'open' },
    { platform: 'facebook', label: 'Facebook', icon: '📘', url: facebookShareUrl(content.shareUrl), action: 'open' },
    { platform: 'twitter', label: 'X (Twitter)', icon: '🐦', url: twitterShareUrl(`${content.name}'s Digital Card`, content.shareUrl), action: 'open' },
    { platform: 'line', label: 'Line', icon: '💚', url: lineShareUrl(content.brandedText), action: 'open' },
    { platform: 'kakaotalk', label: 'KakaoTalk', icon: '💛', url: kakaoTalkShareUrl(content.shareUrl, `${content.name}'s Digital Card`), action: 'open' },
    { platform: 'wechat', label: 'WeChat', icon: '🟢', action: 'copy' }, // WeChat: copy link + show QR
    { platform: 'sms', label: 'Text (SMS)', icon: '💬', url: smsShareUrl(phone || '', content.brandedText), action: 'open' },
    { platform: 'instagram', label: 'Instagram', icon: '📷', action: 'copy' },
    { platform: 'copy', label: 'Copy Link', icon: '🔗', action: 'copy' },
  ]
}

/**
 * Execute a share action. Returns true if the share was handled.
 */
export function executeShareAction(action: ShareAction, content: ShareContent): boolean {
  if (action.action === 'open' && action.url) {
    window.open(action.url, '_blank', 'noopener,noreferrer')
    return true
  }
  if (action.action === 'copy') {
    navigator.clipboard.writeText(content.shareUrl).then(
      () => console.log('Link copied'),
      () => console.error('Copy failed')
    )
    return true
  }
  return false
}
