import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Lock, Unlock, Wallet, ArrowRight, Download } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button component following Premium Japan Design System. Supports multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'danger',
        'success',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary Button
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Lock Assets',
  },
};

// Secondary Button (Gold outline)
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'View Details',
  },
};

// Outline Button
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel',
  },
};

// Ghost Button
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Learn More',
  },
};

// Danger Button
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Revoke Access',
  },
};

// Success Button
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm',
  },
};

// Link Button
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Terms of Service',
  },
};

// With Left Icon
export const WithLeftIcon: Story = {
  args: {
    variant: 'primary',
    leftIcon: <Lock className="h-4 w-4" />,
    children: 'Lock Assets',
  },
};

// With Right Icon
export const WithRightIcon: Story = {
  args: {
    variant: 'secondary',
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Continue',
  },
};

// Loading State
export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Processing...',
  },
};

// Disabled State
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

// Icon Only
export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <Download className="h-4 w-4" />,
    'aria-label': 'Download',
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    leftIcon: <Wallet className="h-4 w-4" />,
    children: 'Connect Wallet',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// Size Comparison
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// Variant Comparison
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};

// Quantum Shield Actions
export const QuantumShieldActions: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-surface rounded-qs-lg">
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<Lock className="h-4 w-4" />}>
          Lock Assets
        </Button>
        <Button variant="secondary" leftIcon={<Unlock className="h-4 w-4" />}>
          Request Unlock
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" leftIcon={<Wallet className="h-4 w-4" />}>
          Connect Wallet
        </Button>
        <Button variant="ghost">View History</Button>
      </div>
    </div>
  ),
};
