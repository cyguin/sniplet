import { isEnabled } from '@cyguin/flag'
import { ClientDemo } from './ClientDemo'
import { ServerDemo } from './ServerDemo'

export default async function HomePage() {
  const serverCheckoutEnabled = await isEnabled('new-checkout')
  const serverDarkModeEnabled = await isEnabled('dark-mode')
  const serverBetaEnabled = await isEnabled('beta-dashboard')

  return (
    <main>
      <h1>@cyguin/flag Demo</h1>
      <p>
        This example demonstrates both server-side and client-side feature flag
        evaluation using the @cyguin/flag package.
      </p>

      <section className="section">
        <h2>Server-Side Evaluation</h2>
        <p>
          Flags evaluated on the server (in Server Components) - no client JavaScript
          needed for initial render.
        </p>

        <div className="card">
          <h3>new-checkout</h3>
          <p>
            Status:{' '}
            <span className={`badge ${serverCheckoutEnabled ? 'badge-success' : 'badge-default'}`}>
              {serverCheckoutEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
          <p>
            This flag is enabled: <code>enabled: true</code>, <code>rolloutPercentage: 100</code>
          </p>
        </div>

        <div className="card">
          <h3>dark-mode</h3>
          <p>
            Status:{' '}
            <span className={`badge ${serverDarkModeEnabled ? 'badge-success' : 'badge-default'}`}>
              {serverDarkModeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
          <p>
            User-targeted: <code>userIds: ['user-123', 'user-456']</code>
          </p>
        </div>

        <div className="card">
          <h3>beta-dashboard</h3>
          <p>
            Status:{' '}
            <span className={`badge ${serverBetaEnabled ? 'badge-success' : 'badge-default'}`}>
              {serverBetaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
          <p>
            This flag has <code>rolloutPercentage: 10</code> - most users see it as disabled
          </p>
        </div>
      </section>

      <section className="section">
        <h2>Client-Side Evaluation</h2>
        <p>
          Flags evaluated in React components using the <code>&lt;Flag&gt;</code> component and{' '}
          <code>useFlag</code> hook.
        </p>
        <ClientDemo />
      </section>

      <section className="section">
        <h2>How It Works</h2>
        <div className="card">
          <h3>1. Server-Side</h3>
          <pre>
            <code>
              {`import { isEnabled } from '@cyguin/flag'

export default async function Page() {
  const showFeature = await isEnabled('new-feature')
  // Use in your server component
}`}
            </code>
          </pre>
        </div>

        <div className="card">
          <h3>2. Client-Side</h3>
          <pre>
            <code>
              {`import { Flag, useFlag } from '@cyguin/flag'

// Using the Flag component
<Flag name="new-feature">
  <NewFeatureComponent />
</Flag>

// Or using the hook
const { enabled } = useFlag('new-feature')`}
            </code>
          </pre>
        </div>

        <div className="card">
          <h3>3. Flag Provider</h3>
          <pre>
            <code>
              {`import { FlagProvider } from '@cyguin/flag'

<FlagProvider initialFlags={flags} pollingInterval={30000}>
  <YourApp />
</FlagProvider>`}
            </code>
          </pre>
        </div>
      </section>
    </main>
  )
}