'use client';

import { useState } from 'react';
import { SignedIn, UserButton } from '@clerk/nextjs';

const METAL_COLORS: Record<string, string> = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  platinum: '#E5E4E2',
  palladium: '#CED0CE',
};

const METAL_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  platinum: 'Platinum',
  palladium: 'Palladium',
};

interface Alert {
  id: string;
  metal: string;
  threshold: string;
  direction: string;
  active: boolean;
  lastSpot: string | null;
  lastFiredAt: string | null;
  snoozeUntil: string | null;
}

interface SpotPrices {
  [key: string]: number;
}

export default function DashboardPage() {
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      metal: 'gold',
      threshold: '2300',
      direction: 'above',
      active: true,
      lastSpot: '2285.50',
      lastFiredAt: '2024-01-15T10:30:00Z',
      snoozeUntil: null,
    },
    {
      id: '2',
      metal: 'silver',
      threshold: '28',
      direction: 'below',
      active: true,
      lastSpot: '28.45',
      lastFiredAt: null,
      snoozeUntil: null,
    },
    {
      id: '3',
      metal: 'gold',
      threshold: '2200',
      direction: 'below',
      active: false,
      lastSpot: '2285.50',
      lastFiredAt: '2024-01-10T08:15:00Z',
      snoozeUntil: '2024-01-20T08:15:00Z',
    },
  ]);

  const [spotPrices] = useState<SpotPrices>({
    gold: 2285.50,
    silver: 28.45,
    platinum: 985.00,
    palladium: 1020.00,
  });

  const getStatus = (alert: Alert): string => {
    if (!alert.active) return 'Snoozed';
    if (alert.snoozeUntil) return 'Snoozed';
    return 'Active';
  };

  const getStatusColor = (status: string): string => {
    if (status === 'Active') return '#22c55e';
    return '#f59e0b';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Your Alerts</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {alerts.filter(a => a.active).length} active alerts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SignedIn>
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>
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
            + New Alert
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '40px'
      }}>
        {Object.entries(spotPrices).map(([metal, price]) => (
          <div
            key={metal}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: METAL_COLORS[metal],
                }}
              />
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{metal}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>
              {formatPrice(price)}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Spot price
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No alerts yet</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>Create your first alert to get notified when prices hit your targets.</p>
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
            Create Alert
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              style={{
                padding: '20px 24px',
                borderBottom: index < alerts.length - 1 ? '1px solid #e5e5e5' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: METAL_COLORS[alert.metal] + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: METAL_COLORS[alert.metal],
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {METAL_LABELS[alert.metal]}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(getStatus(alert)) + '20',
                      color: getStatusColor(getStatus(alert)),
                      fontWeight: 500,
                    }}
                  >
                    {getStatus(alert)}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {alert.direction === 'above' ? '↑' : '↓'} {formatPrice(parseFloat(alert.threshold))}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Last Spot</div>
                <div style={{ fontWeight: 500 }}>
                  {alert.lastSpot ? formatPrice(parseFloat(alert.lastSpot)) : '—'}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Last Fired</div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>
                  {formatDate(alert.lastFiredAt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  title="Edit alert"
                >
                  Edit
                </button>
                <button
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  title={alert.active ? 'Snooze alert' : 'Activate alert'}
                >
                  {alert.active ? 'Snooze' : 'Activate'}
                </button>
                <button
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  title="Delete alert"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
