import type { Meta, StoryObj } from '@storybook/react';
import { ProverApplication } from './ProverApplication';

const meta: Meta<typeof ProverApplication> = {
  title: 'Prover/ProverApplication',
  component: ProverApplication,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverApplication>;

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
