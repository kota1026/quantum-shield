import type { Meta, StoryObj } from '@storybook/react';
import { ProverDashboard } from './ProverDashboard';

const meta: Meta<typeof ProverDashboard> = {
  title: 'Prover/ProverDashboard',
  component: ProverDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverDashboard>;

export const Default: Story = {};

export const English: Story = {
  parameters: {
    nextIntl: {
      locale: 'en',
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
