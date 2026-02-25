import type { Meta, StoryObj } from '@storybook/react';
import { ProverAlerts } from './ProverAlerts';

const meta: Meta<typeof ProverAlerts> = {
  title: 'Prover/ProverAlerts',
  component: ProverAlerts,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverAlerts>;

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
