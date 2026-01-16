import * as React from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { formatAddress } from '../lib/utils';

export interface WalletButtonProps {
  address?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onCopyAddress?: () => void;
  explorerUrl?: string;
  className?: string;
}

function WalletButton({
  address,
  isConnected = false,
  isConnecting = false,
  onConnect,
  onDisconnect,
  onCopyAddress,
  explorerUrl,
  className,
}: WalletButtonProps) {
  if (!isConnected) {
    return (
      <Button
        onClick={onConnect}
        disabled={isConnecting}
        className={cn('gap-2', className)}
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn('gap-2', className)}>
          <Wallet className="h-4 w-4" />
          {formatAddress(address || '')}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        {explorerUrl && (
          <DropdownMenuItem asChild>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDisconnect} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { WalletButton };
