import * as React from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

import { cn, formatAddress } from '../lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';

export interface AddressDisplayProps {
  address: string;
  chars?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  explorerUrl?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

function AddressDisplay({
  address,
  chars = 4,
  showCopy = true,
  showExplorer = false,
  explorerUrl,
  className,
  variant = 'default',
}: AddressDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress =
    variant === 'full' ? address : formatAddress(address, chars);

  return (
    <TooltipProvider>
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              {displayAddress}
            </code>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs">{address}</p>
          </TooltipContent>
        </Tooltip>

        {showCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-qs-success-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="sr-only">Copy address</span>
          </Button>
        )}

        {showExplorer && explorerUrl && (
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">View on explorer</span>
            </a>
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

export { AddressDisplay };
