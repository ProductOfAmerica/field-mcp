'use client';

import { Button } from '@agrimcp/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import { Separator } from '@agrimcp/ui/components/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agrimcp/ui/components/tooltip';
import { TractorIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthLines } from '@/components/auth/auth-lines';

interface AuthPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthPageLayout({
  title,
  description,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <div className="bg-muted flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <Card className="relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg">
        <div className="to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent" />

        <AuthLines className="pointer-events-none absolute inset-x-0 top-0" />

        <CardHeader className="justify-center gap-6 text-center">
          <Link href="/" className="flex items-center justify-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-600 text-white">
              <TractorIcon className="size-5" />
            </div>
            <span className="text-xl font-semibold">AgriMCP</span>
          </Link>

          <div>
            <CardTitle className="mb-1.5 text-2xl">{title}</CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex items-center gap-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="grow">
                  <Button
                    variant="outline"
                    className="w-full cursor-not-allowed opacity-50"
                    disabled
                  >
                    <Image
                      src="https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png"
                      alt="google icon"
                      width={20}
                      height={20}
                      className="size-5"
                      unoptimized
                    />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="grow">
                  <Button
                    variant="outline"
                    className="w-full cursor-not-allowed opacity-50"
                    disabled
                  >
                    <Image
                      src="https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png"
                      alt="github icon"
                      width={20}
                      height={20}
                      className="size-5 dark:invert"
                      unoptimized
                    />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <Separator className="flex-1" />
            <p className="text-muted-foreground text-sm">or</p>
            <Separator className="flex-1" />
          </div>

          {children}

          <p className="text-muted-foreground mt-4 text-center">{footer}</p>
        </CardContent>
      </Card>
    </div>
  );
}
