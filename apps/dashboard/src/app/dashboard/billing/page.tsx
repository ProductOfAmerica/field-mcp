import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { Suspense } from 'react';
import { BillingSkeleton } from '@/components/skeletons';
import { getSubscription, getUsageCount } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { RealtimePlanCard } from './realtime-plan-card';
import { UpgradeButton } from './upgrade-button';

const plans = [
  {
    name: 'Developer',
    tier: 'developer' as const,
    price: '$99',
    description: 'For individual developers and small projects',
    features: [
      '50,000 requests/month',
      '100 requests/minute',
      'Production API access',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Startup',
    tier: 'startup' as const,
    price: '$299',
    description: 'For growing teams and applications',
    features: [
      '250,000 requests/month',
      '500 requests/minute',
      'Production API access',
      'Priority support',
    ],
    popular: true,
  },
];

async function CurrentPlanCard({ userId }: { userId: string }) {
  const [subscription, usageCount] = await Promise.all([
    getSubscription(userId),
    getUsageCount(userId),
  ]);

  return (
    <RealtimePlanCard
      serverSubscription={subscription}
      serverUsageCount={usageCount}
      userId={userId}
    />
  );
}

async function AvailablePlans({ userId }: { userId: string }) {
  const subscription = await getSubscription(userId);
  const tier = subscription?.tier ?? 'free';
  const isPaid = tier !== 'free';

  if (isPaid) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.tier}
            className={plan.popular ? 'border-green-500 border-2' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge className="bg-green-100 text-green-800">
                    <SparklesIcon className="mr-1 size-3" />
                    Popular
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="size-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <UpgradeButton tier={plan.tier} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      <Suspense fallback={<BillingSkeleton />}>
        <CurrentPlanCard userId={user!.id} />
      </Suspense>

      <Suspense fallback={null}>
        <AvailablePlans userId={user!.id} />
      </Suspense>
    </div>
  );
}
