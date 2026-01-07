import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import { Progress } from '@agrimcp/ui/components/progress';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ManageButton } from './manage-button';
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

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('developer_id', user!.id)
    .single();

  const { data: usageStats } = await supabase
    .from('usage_logs')
    .select('id')
    .eq('developer_id', user?.id)
    .gte(
      'request_timestamp',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  const tier = subscription?.tier ?? 'free';
  const isPaid = tier !== 'free';
  const isCanceling = subscription?.cancel_at_period_end;
  const requestsUsed = usageStats?.length ?? 0;
  const requestsLimit = subscription?.monthly_request_limit ?? 1000;
  const usagePercentage = Math.min((requestsUsed / requestsLimit) * 100, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant="secondary" className="capitalize">
                  {tier}
                </Badge>
                {isCanceling && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-300"
                  >
                    Cancels at period end
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {requestsLimit.toLocaleString()} requests/month
              </CardDescription>
            </div>
            {isPaid && <ManageButton />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly usage</span>
              <span className="font-medium">
                {requestsUsed.toLocaleString()} /{' '}
                {requestsLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
          {isCanceling && subscription?.current_period_end && (
            <p className="text-sm text-amber-600">
              Your access will continue until{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {!isPaid && (
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
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
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
      )}
    </div>
  );
}
