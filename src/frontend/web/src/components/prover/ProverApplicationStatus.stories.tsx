import type { Meta, StoryObj } from '@storybook/react';
import { ProverApplicationStatus } from './ProverApplicationStatus';

const meta: Meta<typeof ProverApplicationStatus> = {
  title: 'Prover/ProverApplicationStatus',
  component: ProverApplicationStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverApplicationStatus>;

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
