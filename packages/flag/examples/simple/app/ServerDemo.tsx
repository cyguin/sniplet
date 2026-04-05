import { isEnabled } from '@cyguin/flag'

export async function ServerDemo() {
  const checkoutEnabled = await isEnabled('new-checkout')
  const darkModeEnabled = await isEnabled('dark-mode')

  return (
    <div className="card">
      <h3>Server-Side Flags</h3>
      <p>These values are evaluated on the server:</p>
      <ul>
        <li>new-checkout: {checkoutEnabled ? '✓ Enabled' : '✗ Disabled'}</li>
        <li>dark-mode: {darkModeEnabled ? '✓ Enabled' : '✗ Disabled'}</li>
      </ul>
    </div>
  )
}