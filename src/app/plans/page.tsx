'use client';

import Navbar from '@/components/layout/Navbar';
import { useSubscriptionPlans, useSubscription, useManageSubscription } from '@/hooks/useTemplates';
import { useProfile } from '@/hooks/useProfile';

export default function PlansPage() {
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscriptionData, isLoading: subLoading } = useSubscription();
  const { data: profile } = useProfile();
  const manageSubscription = useManageSubscription();

  const activePlanCode = profile?.premium_plan || 'free';
  const currentSubscription = subscriptionData?.subscription;

  function formatPrice(plan: any) {
    if (plan.price_cents === 0) return 'Free';
    const dollars = (plan.price_cents / 100).toFixed(2);
    return `$${dollars}/${plan.interval === 'monthly' ? 'mo' : plan.interval === 'yearly' ? 'yr' : plan.interval}`;
  }

  async function subscribe(planCode: string) {
    try {
      await manageSubscription.mutateAsync({ action: 'subscribe', plan_code: planCode });
      alert('Subscription activated!');
    } catch (error: any) {
      alert(error.message || 'Failed to subscribe');
    }
  }

  async function cancel() {
    if (!confirm('Cancel your current subscription?')) return;
    try {
      await manageSubscription.mutateAsync({ action: 'cancel' });
      alert('Subscription cancelled.');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel subscription');
    }
  }

  const plans = plansData?.plans || [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Upgrade Your BiteTrack Experience</h1>
          <p className="text-gray-600 mb-8">
            Unlock advanced insights, AI meal planning, and more. Choose the plan that fits your goals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansLoading ? (
              <div className="col-span-3 text-center text-gray-500">Loading plans…</div>
            ) : (
              plans.map((plan: any) => {
                const isActive = activePlanCode === plan.code;
                const features = Array.isArray(plan.features) ? plan.features : [];
                return (
                  <div
                    key={plan.code}
                    className={`rounded-3xl shadow-xl p-6 border-2 transition-all ${
                      isActive ? 'border-orange-500 bg-white' : 'border-transparent bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                      {isActive && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                          Current Plan
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">{formatPrice(plan)}</div>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <ul className="space-y-2 mb-6">
                      {features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-orange-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => subscribe(plan.code)}
                      disabled={isActive || manageSubscription.isPending}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        isActive
                          ? 'bg-gray-200 text-gray-600 cursor-default'
                          : 'gradient-primary text-white hover:shadow-lg'
                      }`}
                    >
                      {isActive ? 'Active Plan' : manageSubscription.isPending ? 'Processing…' : 'Choose Plan'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {currentSubscription && (
            <div className="mt-10 bg-white rounded-3xl shadow-xl p-6 border-2 border-orange-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your Subscription</h2>
              <p className="text-gray-600 mb-4">
                {currentSubscription.subscription_plans?.name || 'Unknown plan'} • {currentSubscription.status}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancel}
                  disabled={manageSubscription.isPending}
                  className="px-4 py-2 bg-white text-orange-600 border-2 border-orange-200 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 p-6 bg-white rounded-3xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Included with Pro</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <li>• AI meal planner with grocery lists</li>
              <li>• 30/90-day analytics and adherence score</li>
              <li>• Smart habit coaching & reminders</li>
              <li>• Priority support & roadmap influence</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

