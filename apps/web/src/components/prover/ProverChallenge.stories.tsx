import type { Meta, StoryObj } from '@storybook/react';
import { ProverChallenge } from './ProverChallenge';

const meta: Meta<typeof ProverChallenge> = {
  title: 'Prover/ProverChallenge',
  component: ProverChallenge,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextIntl: {
      locale: 'ja',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProverChallenge>;

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
