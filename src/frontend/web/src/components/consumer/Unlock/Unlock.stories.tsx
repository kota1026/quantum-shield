import type { Meta, StoryObj } from '@storybook/react';
import { Unlock } from './index';
import { LockCard, LockItem } from './LockCard';
import { MethodCard } from './MethodCard';

const meta: Meta<typeof Unlock> = {
  title: 'Consumer/Unlock',
  component: Unlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Unlock - Select locked assets and unlock method',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Unlock>;

// Full Unlock Page
export const Default: Story = {};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Lock Card Stories
const sampleLocks: LockItem[] = [
  {
    id: '1',
    number: 1,
    amount: '10.00 ETH',
    timestamp: '2026-01-01 10:00',
    status: 'locked',
  },
  {
    id: '2',
    number: 2,
    amount: '5.00 ETH',
    timestamp: '2026-01-03 14:30',
    status: 'locked',
  },
  {
    id: '3',
    number: 3,
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
    remainingTime: '23:41:02',
  },
];

export const LockCards: StoryObj<typeof LockCard> = {
  render: () => (
    <div className="p-6 bg-background max-w-lg space-y-3">
      {sampleLocks.map((lock, index) => (
        <LockCard
          key={lock.id}
          lock={lock}
          selected={index === 0}
          onSelect={() => console.log('Selected:', lock.id)}
        />
      ))}
    </div>
  ),
};

// Method Card Stories
export const MethodCards: StoryObj<typeof MethodCard> = {
  render: () => (
    <div className="p-6 bg-background max-w-2xl grid grid-cols-2 gap-4">
      <MethodCard
        type="normal"
        selected={true}
        onSelect={() => console.log('Normal selected')}
        onHelpClick={() => console.log('Help clicked')}
      />
      <MethodCard
        type="emergency"
        selected={false}
        onSelect={() => console.log('Emergency selected')}
      />
    </div>
  ),
};

// Emergency Selected
export const EmergencyMethodSelected: StoryObj<typeof MethodCard> = {
  render: () => (
    <div className="p-6 bg-background max-w-2xl grid grid-cols-2 gap-4">
      <MethodCard
        type="normal"
        selected={false}
        onSelect={() => {}}
        onHelpClick={() => {}}
      />
      <MethodCard
        type="emergency"
        selected={true}
        onSelect={() => {}}
      />
    </div>
  ),
};
