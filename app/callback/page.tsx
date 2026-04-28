import { redirect } from 'next/navigation'

export default function LegacyCallback() {
  redirect('/auth/callback')
}
