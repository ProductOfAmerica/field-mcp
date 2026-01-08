import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import { CodeIcon, KeyIcon, LinkIcon } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    title: 'Create an API Key',
    description: 'Generate your first API key to authenticate requests',
    href: '/dashboard/keys',
    icon: KeyIcon,
  },
  {
    number: 2,
    title: 'Connect a Farmer',
    description: "Link a farmer's John Deere account via OAuth",
    href: '/dashboard/connections',
    icon: LinkIcon,
  },
  {
    number: 3,
    title: 'Use the MCP Server',
    description: 'Start making requests to the unified API',
    href: '#',
    icon: CodeIcon,
  },
];

export function QuickStartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start</CardTitle>
        <CardDescription>Get started with AgriMCP in 3 steps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <Link
            key={step.number}
            href={step.href}
            className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Badge
              variant="outline"
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              {step.number}
            </Badge>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <step.icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{step.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </Link>
        ))}

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-2">MCP Endpoint</p>
          <code className="block rounded bg-background px-3 py-2 text-sm">
            POST {process.env.NEXT_PUBLIC_GATEWAY_URL}/v1/john-deere
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
