'use client';

import { useState } from 'react';
import { SignedIn, UserButton } from '@clerk/nextjs';

const PLANS = {
  free: { name: 'Free', price: 0, alerts: 3 },
  stacker: { name: 'Stacker', price: 9, alerts: 10 },
  vault: { name: 'Vault', price: 19, alerts: 50 },
};

const METAL_COLORS: Record<string, string> = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  platinum: '#E5E4E2',
  palladium: '#CED0CE',
};

interface SpotPrices {
  [key: string]: number;
}

export default function AccountPage() {
  const [currentPlan] = useState<'free' | 'stacker' | 'vault'>('free');
  const [alertCount] = useState(3);

  const [spotPrices] = useState<SpotPrices>({
    gold: 2285.50,
    silver: 28.45,
    platinum: 985.00,
    palladium: 1020.00,
  });

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleManageSubscription = () => {
    window.location.href = '/api/webhooks/stripe/portal';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Account</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Manage your subscription and billing</p>
        </div>
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Current Plan</h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>
                {PLANS[currentPlan].name}
                {currentPlan !== 'free' && (
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginLeft: '8px' }}>
                    ${PLANS[currentPlan].price}/mo
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                {alertCount} of {PLANS[currentPlan].alerts} alerts used
              </div>
            </div>
            <div style={{
              width: '120px',
              height: '8px',
              backgroundColor: '#e5e5e5',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(alertCount / PLANS[currentPlan].alerts) * 100}%`,
                height: '100%',
                backgroundColor: alertCount >= PLANS[currentPlan].alerts ? '#f59e0b' : '#22c55e',
                borderRadius: '4px',
              }} />
            </div>
          </div>

          {currentPlan === 'free' ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Stacker — $9/mo
              </button>
              <button
                style={{
                  backgroundColor: '#FFD700',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Vault — $19/mo
              </button>
            </div>
          ) : (
            <button
              onClick={handleManageSubscription}
              style={{
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Manage Subscription
            </button>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Plans</h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {(['free', 'stacker', 'vault'] as const).map((planKey) => {
              const plan = PLANS[planKey];
              const isCurrentPlan = currentPlan === planKey;
              
              return (
                <div
                  key={planKey}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: isCurrentPlan ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
                    backgroundColor: isCurrentPlan ? '#f9f9f9' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{plan.name}</span>
                      {isCurrentPlan && (
                        <span style={{
                          fontSize: '12px',
                          marginLeft: '8px',
                          padding: '2px 8px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          borderRadius: '4px',
                        }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Up to {plan.alerts} price alerts
                  </div>
                  {planKey !== 'free' && !isCurrentPlan && (
                    <button
                      style={{
                        marginTop: '12px',
                        backgroundColor: planKey === 'vault' ? '#FFD700' : '#1a1a1a',
                        color: planKey === 'vault' ? '#1a1a1a' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Current Spot Prices</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {Object.entries(spotPrices).map(([metal, price]) => (
              <div
                key={metal}
                style={{
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: METAL_COLORS[metal],
                    margin: '0 auto 8px',
                  }}
                />
                <div style={{ textTransform: 'capitalize', fontWeight: 500, marginBottom: '4px' }}>
                  {metal}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formatPrice(price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
