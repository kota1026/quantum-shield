import type { Meta, StoryObj } from '@storybook/react';
import { ProverMetrics } from './ProverMetrics';

const meta: Meta<typeof ProverMetrics> = {
  title: 'Prover/ProverMetrics',
  component: ProverMetrics,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverMetrics>;

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
