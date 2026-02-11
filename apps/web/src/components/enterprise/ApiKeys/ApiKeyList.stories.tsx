import type { Meta, StoryObj } from '@storybook/react';
import { ApiKeyList } from './index';

const meta: Meta<typeof ApiKeyList> = {
  title: 'Enterprise/ApiKeyList',
  component: ApiKeyList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ApiKeyList>;

export const Default: Story = {};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
