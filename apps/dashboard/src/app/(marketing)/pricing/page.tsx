'use client';

import { TIER_LIMITS } from '@fieldmcp/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@fieldmcp/ui/components/accordion';
import { Badge } from '@fieldmcp/ui/components/badge';
import { Button } from '@fieldmcp/ui/components/button';
import { Card, CardContent } from '@fieldmcp/ui/components/card';
import { NumberTicker } from '@fieldmcp/ui/components/number-ticker';
import { Switch } from '@fieldmcp/ui/components/switch';
import { cn } from '@fieldmcp/ui/lib/utils';
import { CheckIcon, CircleIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ALL_PRICING_TIERS } from '@/lib/pricing';

// Annual pricing (10% discount)
const ANNUAL_PRICES: Record<string, number | null> = {
  free: 0,
  developer: 89,
  startup: 269,
  enterprise: null,
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      {/* Pricing Section */}
      <section className="bg-muted py-8 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <Badge variant="outline" className="text-sm font-normal">
                Pricing
              </Badge>
              <h1 className="text-4xl font-semibold">
                Choose the right plan for your needs
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl">
                Start free and scale as you grow. All plans include access to
                John Deere Operations Center data through our unified MCP API.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-base font-medium',
                  !isAnnual ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span
                className={cn(
                  'text-base font-medium',
                  isAnnual ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                Annually
                <span className="ml-1.5 text-xs text-green-600 font-medium">
                  Save 10%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <Card className="shadow-none">
            <CardContent className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-4">
              {ALL_PRICING_TIERS.map((tier) => {
                const monthlyPrice = tier.price;
                const annualPrice = ANNUAL_PRICES[tier.tier];
                const currentPrice = isAnnual ? annualPrice : monthlyPrice;
                const isPopular = tier.popular;
                const isEnterprise = tier.tier === 'enterprise';

                return (
                  <div
                    key={tier.tier}
                    className={cn('flex flex-col gap-8 p-6', {
                      'bg-muted rounded-[14px] shadow-lg': isPopular,
                    })}
                  >
                    <div className="flex flex-col gap-6">
                      {/* Plan Name & Badge */}
                      <div
                        className={cn('flex items-center', {
                          'justify-between': isPopular,
                          'justify-start': !isPopular,
                        })}
                      >
                        <h3 className="text-3xl font-bold">{tier.name}</h3>
                        {isPopular && (
                          <Badge className="bg-primary rounded-lg px-3 py-1">
                            Popular
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline">
                        <span className="text-muted-foreground text-lg font-medium">
                          $
                        </span>
                        {isEnterprise ? (
                          <span className="text-5xl font-bold">Custom</span>
                        ) : (
                          <>
                            <NumberTicker
                              value={currentPrice ?? 0}
                              className="text-5xl font-bold"
                            />
                            <span className="text-muted-foreground self-end text-lg font-medium ml-1">
                              /{isAnnual ? 'year' : 'month'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="flex flex-col gap-3">
                      {tier.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-2 py-1"
                        >
                          <CircleIcon className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
                          <p className="text-base">{feature}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-1 items-end">
                      <Button
                        asChild
                        variant={isPopular ? 'default' : 'secondary'}
                        size="lg"
                        className="w-full"
                      >
                        {isEnterprise ? (
                          <Link href="mailto:sales@fieldmcp.com">
                            {tier.cta}
                          </Link>
                        ) : (
                          <Link href="/signup">{tier.cta}</Link>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare plans
          </h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-medium">Free</th>
                  <th className="text-center py-4 px-4 font-medium">
                    Developer
                  </th>
                  <th className="text-center py-4 px-4 font-medium bg-primary/5">
                    Startup
                  </th>
                  <th className="text-center py-4 px-4 font-medium">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Monthly requests</td>
                  <td className="text-center py-4 px-4">
                    {TIER_LIMITS.free.monthly.toLocaleString()}
                  </td>
                  <td className="text-center py-4 px-4">
                    {TIER_LIMITS.developer.monthly.toLocaleString()}
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    {TIER_LIMITS.startup.monthly.toLocaleString()}
                  </td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Rate limit</td>
                  <td className="text-center py-4 px-4">
                    {TIER_LIMITS.free.perMinute}/min
                  </td>
                  <td className="text-center py-4 px-4">
                    {TIER_LIMITS.developer.perMinute}/min
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    {TIER_LIMITS.startup.perMinute}/min
                  </td>
                  <td className="text-center py-4 px-4">
                    {TIER_LIMITS.enterprise.perMinute}/min
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">John Deere API</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Usage analytics</td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Support</td>
                  <td className="text-center py-4 px-4">Community</td>
                  <td className="text-center py-4 px-4">Email</td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    Priority
                  </td>
                  <td className="text-center py-4 px-4">Dedicated</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">SLA</td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4">99%</td>
                  <td className="text-center py-4 px-4 bg-primary/5">99.5%</td>
                  <td className="text-center py-4 px-4">99.9%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Custom SLA</td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">SSO & Audit logs</td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5 text-muted-foreground">
                    &mdash;
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="size-4 text-green-600 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex flex-col items-center gap-4 text-center mb-12">
            <Badge variant="outline" className="text-sm font-normal">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">
                What counts as a request?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each API call to our MCP gateway counts as one request. This
                includes all tool calls like listing fields, getting boundaries,
                or fetching harvest data. Failed requests due to rate limiting
                do not count against your quota.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">
                Can I upgrade or downgrade at any time?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can upgrade immediately and the prorated amount will be
                charged. Downgrades take effect at the end of your current
                billing period. You can manage your subscription from the
                dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">
                What happens if I exceed my limits?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If you exceed your monthly request limit, additional requests
                will be rejected with a 429 status code until the next billing
                cycle. We don&apos;t charge overage fees&mdash;your service is
                simply rate-limited. We recommend upgrading before hitting
                limits for uninterrupted service.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">
                Do you offer refunds?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All sales are final. However, you can cancel at any time and
                continue using the service until the end of your billing period.
                See our{' '}
                <Link href="/legal/terms" className="underline">
                  Terms of Service
                </Link>{' '}
                for details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">
                What agricultural providers are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, we support John Deere Operations Center. Climate
                FieldView and CNHi integrations are on our roadmap. Enterprise
                customers can request priority access to new integrations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <ZapIcon className="size-12 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Create a free account and start accessing agricultural data in
            minutes. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="mailto:sales@fieldmcp.com">Contact sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
