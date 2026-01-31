import type { Meta, StoryObj } from '@storybook/react';
import { ProverExit } from './ProverExit';

const meta: Meta<typeof ProverExit> = {
  title: 'Prover/ProverExit',
  component: ProverExit,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverExit>;

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
