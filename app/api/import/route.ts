import { NextRequest, NextResponse } from 'next/server'

// ─── AppWrite Configuration ───────────────────────────────────────────────
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const APPWRITE_API_KEY = 'standard_92263f87a1f5997df5f5a97d290da86abdc7e0899b253c0e5094bc1f74c290793f5e5b103468b95f93214a7dba96f64493f0b28221a964379df0d995afca8ec3df01955e96665c938cd0ca093c2b389b68fb2cfd159e8ed2943fd19b952c80bfdfe07759524b0265a3687fe5da005e3df5617ed66675432afd64f1d18c846ceb'

// ─── Types ─────────────────────────────────────────────────────────────────
interface CardFields {
  name: string
  name_zh: string
  title: string
  title_zh: string
  company: string
  company_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
}

interface ImportError {
  row: number
  message: string
  raw?: string
}

interface ImportSummary {
  imported: number
  skipped: number
  total: number
  errors: ImportError[]
}

// ─── AppWrite REST helpers ─────────────────────────────────────────────────
function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY,
    'Content-Type': 'application/json',
  }
}

async function verifyJWT(userId: string, appwriteJWT: string): Promise<boolean> {
  try {
    const verifyRes = await fetch(`${APPWRITE_ENDPOINT}/account`, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-JWT': appwriteJWT,
      },
    })
    if (!verifyRes.ok) {
      console.warn('[IMPORT] JWT verification failed (status %s)', verifyRes.status)
      return false
    }
    const account = await verifyRes.json()
    if (account.$id !== userId) {
      console.warn('[IMPORT] User ID mismatch: JWT=%s ≠ body=%s', account.$id, userId)
      return false
    }
    console.log('[IMPORT] JWT verified for:', account.email)
    return true
  } catch (err: any) {
    console.error('[IMPORT] JWT verification error:', err.message)
    return false
  }
}

async function createCard(userId: string, fields: CardFields): Promise<boolean> {
  try {
    const cardData = {
      user_id: userId,
      name: fields.name || '',
      name_zh: fields.name_zh || '',
      title: fields.title || '',
      title_zh: fields.title_zh || '',
      company: fields.company || '',
      company_zh: fields.company_zh || '',
      email: fields.email || '',
      phone: fields.phone || '',
      address: fields.address || '',
      address_zh: fields.address_zh || '',
      lastModified: new Date().toISOString(),
    }

    const res = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${CARDS_COLLECTION}/documents`,
      {
        method: 'POST',
        headers: appwriteHeaders(),
        body: JSON.stringify({
          documentId: 'unique()',
          data: cardData,
          permissions: [
            `read("user:${userId}")`,
            `update("user:${userId}")`,
            `delete("user:${userId}")`,
          ],
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }))
      console.error('[IMPORT] Card creation failed:', errBody)
      return false
    }
    return true
  } catch (err: any) {
    console.error('[IMPORT] Card creation error:', err.message)
    return false
  }
}

// ─── CSV Parsing ───────────────────────────────────────────────────────────
// Normalize a string: lowercase, strip whitespace, replace spaces/punctuation with underscores
function normalizeHeader(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

// Map many possible column names to our internal field names
const CSV_COLUMN_MAP: Record<string, keyof CardFields> = {
  // Standard / our own export format
  name: 'name',
  name_zh: 'name_zh',
  title: 'title',
  title_zh: 'title_zh',
  company: 'company',
  company_zh: 'company_zh',
  email: 'email',
  phone: 'phone',
  address: 'address',
  address_zh: 'address_zh',

  // CamCard export column names (English UI)
  full_name: 'name',
  first_name: 'name',
  last_name: 'name',
  display_name: 'name',
  chinese_name: 'name_zh',
  name_cn: 'name_zh',
  job_title: 'title',
  title_en: 'title',
  title_cn: 'title_zh',
  organization: 'company',
  company_name: 'company',
  org: 'company',
  company_en: 'company',
  company_cn: 'company_zh',
  email_address: 'email',
  e_mail: 'email',
  mail: 'email',
  phone_number: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telephone: 'phone',
  contact_number: 'phone',
  addr: 'address',
  address_en: 'address',
  address_cn: 'address_zh',
  // CamCard Chinese UI column names
  '姓名': 'name',
  '中文姓名': 'name_zh',
  '职位': 'title',
  '中文职位': 'title_zh',
  '公司': 'company',
  '中文公司': 'company_zh',
  '邮箱': 'email',
  '电话': 'phone',
  '地址': 'address',
  '中文地址': 'address_zh',
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const nextCh = text[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (nextCh === '"') {
          // escaped quote
          currentField += '"'
          i++ // skip next char
        } else {
          inQuotes = false
        }
      } else {
        currentField += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        currentRow.push(currentField)
        currentField = ''
      } else if (ch === '\n') {
        currentRow.push(currentField)
        currentField = ''
        rows.push(currentRow)
        currentRow = []
      } else if (ch === '\r') {
        // ignore CR; let LF handle it
        if (nextCh === '\n') {
          // CRLF → handled when we see LF
        } else {
          currentRow.push(currentField)
          currentField = ''
          rows.push(currentRow)
          currentRow = []
        }
      } else {
        currentField += ch
      }
    }
  }

  // Don't forget the last field/row
  currentRow.push(currentField)
  if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
    rows.push(currentRow)
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = rows[0]
  const data = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''))
  return { headers, rows: data }
}

function mapCSVRow(headers: string[], row: string[]): CardFields | null {
  const fields: CardFields = {
    name: '',
    name_zh: '',
    title: '',
    title_zh: '',
    company: '',
    company_zh: '',
    email: '',
    phone: '',
    address: '',
    address_zh: '',
  }

  let hasData = false

  for (let i = 0; i < headers.length; i++) {
    const rawHeader = headers[i]
    const normalized = normalizeHeader(rawHeader)
    const fieldName = CSV_COLUMN_MAP[rawHeader] || CSV_COLUMN_MAP[normalized]
    if (!fieldName) continue

    const value = (row[i] || '').trim()
    if (value) {
      // Handle composite first/last name → name
      if (normalized === 'first_name' && fields.name) {
        fields.name = value + ' ' + fields.name
      } else if (normalized === 'last_name' && fields.name) {
        fields.name = fields.name + ' ' + value
      } else if (fieldName === 'name' && normalized === 'first_name') {
        // fallback just set it
      }

      if (!fields[fieldName]) {
        fields[fieldName] = value
      } else if (fieldName === 'name' && normalized === 'full_name') {
        // full_name overrides first/last combo
        fields[fieldName] = value
      }

      hasData = true
    }
  }

  return hasData ? fields : null
}

// ─── vCard Parsing ─────────────────────────────────────────────────────────
interface VCardEntry {
  fn: string
  n: string
  org: string
  title: string
  email: string
  tel: string
  adr: string
  [key: string]: string // allow custom X- fields
}

function parseVCard(text: string): VCardEntry[] {
  const entries: VCardEntry[] = []
  const blocks = text.split(/END:VCARD/i)

  for (const block of blocks) {
    if (!block.toUpperCase().includes('BEGIN:VCARD')) continue

    const entry: VCardEntry = { fn: '', n: '', org: '', title: '', email: '', tel: '', adr: '' }
    const lines = block.split(/\r?\n/)

    for (const rawLine of lines) {
      // Handle folded lines (RFC 2425: line starting with space/tab is continuation)
      const line = rawLine.trim()
      if (!line || line.toUpperCase() === 'BEGIN:VCARD' || line.toUpperCase().startsWith('VERSION')) {
        continue
      }

      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue

      const propName = line.substring(0, colonIdx).trim().toUpperCase()
      // Strip parameters like TYPE=, ENCODING=, CHARSET= etc.
      const cleanName = propName.split(';')[0]
      const propValue = line.substring(colonIdx + 1).trim()

      switch (cleanName) {
        case 'FN':
          if (!entry.fn) entry.fn = propValue
          break
        case 'N':
          if (!entry.n) entry.n = propValue
          break
        case 'ORG':
          if (!entry.org) entry.org = propValue
          break
        case 'TITLE':
          if (!entry.title) entry.title = propValue
          break
        case 'EMAIL':
          entry.email = entry.email ? entry.email : propValue
          break
        case 'TEL':
        case 'TELEPHONE':
          entry.tel = entry.tel ? entry.tel : propValue
          break
        case 'ADR':
          if (!entry.adr) entry.adr = propValue
          break
        default:
          // handle custom X- properties
          if (cleanName.startsWith('X-')) {
            entry[cleanName] = propValue
          }
          break
      }
    }

    // Only include if there's at least a name
    if (entry.fn || entry.n) {
      entries.push(entry)
    }
  }

  return entries
}

function vCardToCardFields(entry: VCardEntry): CardFields {
  // Parse N field: Last;First;Middle;Prefix;Suffix
  let name = entry.fn || ''
  if (!name && entry.n) {
    const parts = entry.n.split(';')
    const lastName = parts[0] || ''
    const firstName = parts[1] || ''
    name = [firstName, lastName].filter(Boolean).join(' ')
  }

  // Parse ADR field: PO Box;Extended;Street;City;Region;Postal Code;Country
  let address = ''
  if (entry.adr) {
    const parts = entry.adr.split(';')
    // Join non-empty parts with comma
    address = parts.filter(Boolean).join(', ')
  }

  // Extract Chinese fields from custom X- properties
  const nameZh = entry['X-PHONETIC-LAST-NAME'] || entry['X-NAME-ZH'] || ''
  const titleZh = entry['X-TITLE-ZH'] || ''
  const companyZh = entry['X-ORG-ZH'] || entry['X-COMPANY-ZH'] || ''
  const addressZh = entry['X-ADR-ZH'] || entry['X-ADDRESS-ZH'] || ''

  return {
    name,
    name_zh: nameZh,
    title: entry.title || '',
    title_zh: titleZh,
    company: entry.org || '',
    company_zh: companyZh,
    email: entry.email || '',
    phone: entry.tel || '',
    address,
    address_zh: addressZh,
  }
}

// ─── File type detection ───────────────────────────────────────────────────
function detectFormat(fileName: string, content: string): 'csv' | 'vcard' | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'vcf' || ext === 'vcard') return 'vcard'
  if (ext === 'csv') return 'csv'

  // Sniff content
  const firstLine = content.split('\n')[0]?.trim() || ''
  if (firstLine.toUpperCase().startsWith('BEGIN:VCARD')) return 'vcard'
  if (firstLine.includes(',')) return 'csv'

  return null
}

// ─── Route Handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null
    const appwriteJWT = formData.get('appwriteJWT') as string | null

    // ── Validation ──────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    if (!appwriteJWT) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ── JWT Verification ────────────────────────────────────────────────
    const jwtValid = await verifyJWT(userId, appwriteJWT)
    if (!jwtValid) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // ── Read file content ───────────────────────────────────────────────
    const fileBuffer = await file.arrayBuffer()
    const content = new TextDecoder('utf-8').decode(fileBuffer)

    if (!content.trim()) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // ── Detect format ───────────────────────────────────────────────────
    const format = detectFormat(file.name, content)
    if (!format) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a CSV or vCard (.vcf) file.' },
        { status: 400 }
      )
    }

    console.log('[IMPORT] Format: %s, File: %s, Size: %d bytes', format, file.name, content.length)

    // ── Parse entries ───────────────────────────────────────────────────
    let cardFields: CardFields[] = []

    if (format === 'csv') {
      const { headers, rows } = parseCSV(content)
      console.log('[IMPORT] CSV parsed: %d headers, %d rows', headers.length, rows.length)

      for (let i = 0; i < rows.length; i++) {
        const mapped = mapCSVRow(headers, rows[i])
        if (mapped) {
          cardFields.push(mapped)
        }
      }
    } else {
      // vCard
      const entries = parseVCard(content)
      console.log('[IMPORT] vCard parsed: %d entries', entries.length)
      cardFields = entries.map(vCardToCardFields)
    }

    console.log('[IMPORT] Total parsed entries:', cardFields.length)

    // ── Create cards in AppWrite ────────────────────────────────────────
    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      total: cardFields.length,
      errors: [],
    }

    for (let i = 0; i < cardFields.length; i++) {
      const fields = cardFields[i]

      // Skip rows with no useful data
      if (!fields.name && !fields.name_zh && !fields.company && !fields.email && !fields.phone) {
        summary.skipped++
        summary.errors.push({
          row: i + 1,
          message: 'No recognizable data in entry',
        })
        continue
      }

      const success = await createCard(userId, fields)
      if (success) {
        summary.imported++
      } else {
        summary.skipped++
        summary.errors.push({
          row: i + 1,
          message: 'Failed to create card in database',
          raw: fields.name || fields.name_zh || fields.email || `Entry #${i + 1}`,
        })
      }
    }

    console.log('[IMPORT] Done — imported: %d, skipped: %d, total: %d', summary.imported, summary.skipped, summary.total)

    return NextResponse.json(summary, { status: 200 })
  } catch (error: any) {
    console.error('[IMPORT] Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to import contacts', message: error.message },
      { status: 500 }
    )
  }
}
