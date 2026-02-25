import type { Meta, StoryObj } from '@storybook/react';
import { ProverQueue } from './ProverQueue';

const meta: Meta<typeof ProverQueue> = {
  title: 'Prover/ProverQueue',
  component: ProverQueue,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverQueue>;

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
