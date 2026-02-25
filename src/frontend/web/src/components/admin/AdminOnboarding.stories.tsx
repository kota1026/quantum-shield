import type { Meta, StoryObj } from '@storybook/react';
import { AdminOnboarding } from './AdminOnboarding';

const meta: Meta<typeof AdminOnboarding> = {
  title: 'Admin/Onboarding',
  component: AdminOnboarding,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminOnboarding>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
