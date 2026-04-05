'use client'

import { Flag, useFlag } from '@cyguin/flag'

function FlagDemo({ name, description }: { name: string; description: string }) {
  const { enabled, isLoading } = useFlag(name)

  if (isLoading) {
    return (
      <div className="card">
        <h3>{name}</h3>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`card ${enabled ? 'flag-enabled' : 'flag-disabled'}`}>
      <h3>{name}</h3>
      <p>{description}</p>
      <p>
        Status:{' '}
        <span className={`badge ${enabled ? 'badge-success' : 'badge-default'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </p>
    </div>
  )
}

function ConditionalRenderDemo() {
  return (
    <div className="card">
      <h3>Using the Flag Component</h3>
      <p>These components only render when the flag is enabled:</p>

      <Flag name="new-checkout">
        <div className="card flag-enabled">
          <h4>🎉 New Checkout Flow</h4>
          <p>
            This component only renders when <code>new-checkout</code> is enabled.
          </p>
        </div>
      </Flag>

      <Flag name="beta-dashboard">
        <div className="card flag-enabled">
          <h4>🆕 Beta Dashboard</h4>
          <p>
            This component only renders when <code>beta-dashboard</code> is enabled.
          </p>
        </div>
      </Flag>

      <Flag name="beta-dashboard" fallback={<div className="card flag-disabled">Using old dashboard</div>}>
        <div className="card flag-enabled">Using new beta dashboard</div>
      </Flag>
    </div>
  )
}

export function ClientDemo() {
  return (
    <>
      <FlagDemo
        name="new-checkout"
        description="Boolean flag - simply on/off"
      />
      <FlagDemo
        name="beta-dashboard"
        description="Percentage rollout flag - 10% of users"
      />
      <FlagDemo
        name="dark-mode"
        description="User-targeted flag - specific users always get it"
      />
      <ConditionalRenderDemo />
    </>
  )
}