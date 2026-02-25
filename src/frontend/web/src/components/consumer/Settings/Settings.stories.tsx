import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from './index';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { ToggleSwitch } from './ToggleSwitch';
import { Key, Bell, Moon, LogOut } from 'lucide-react';
import React from 'react';

// Storybook Meta
const meta: Meta<typeof Settings> = {
  title: 'Consumer/Settings',
  component: Settings,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Settings page for account, notifications, display, security, and support options',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Settings>;

// Full Settings Page
export const Default: Story = {};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Tablet View
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// ToggleSwitch Stories
export const ToggleSwitchStates: StoryObj<typeof ToggleSwitch> = {
  render: () => {
    const ToggleDemo = () => {
      const [checked1, setChecked1] = React.useState(true);
      const [checked2, setChecked2] = React.useState(false);
      return (
        <div className="p-6 bg-background space-y-4">
          <div className="flex items-center gap-4">
            <ToggleSwitch checked={checked1} onChange={setChecked1} />
            <span className="text-foreground">Checked (On)</span>
          </div>
          <div className="flex items-center gap-4">
            <ToggleSwitch checked={checked2} onChange={setChecked2} />
            <span className="text-foreground">Unchecked (Off)</span>
          </div>
          <div className="flex items-center gap-4">
            <ToggleSwitch checked={true} onChange={() => {}} disabled />
            <span className="text-foreground-secondary">Disabled (On)</span>
          </div>
          <div className="flex items-center gap-4">
            <ToggleSwitch checked={false} onChange={() => {}} disabled />
            <span className="text-foreground-secondary">Disabled (Off)</span>
          </div>
        </div>
      );
    };
    return <ToggleDemo />;
  },
};

// SettingsItem Variants
export const SettingsItemVariants: StoryObj<typeof SettingsItem> = {
  render: () => {
    const ItemDemo = () => {
      const [toggle, setToggle] = React.useState(true);
      return (
        <div className="p-6 bg-background max-w-lg">
          <div className="bg-surface border border-border rounded-qs-xl overflow-hidden">
            <SettingsItem
              icon={<Key className="w-5 h-5" />}
              title="Navigation Item"
              description="Click to navigate"
              action={{ type: 'navigate', onClick: () => alert('Navigate') }}
            />
            <SettingsItem
              icon={<Bell className="w-5 h-5" />}
              title="Toggle Item"
              description="Toggle on or off"
              action={{ type: 'toggle', checked: toggle, onChange: setToggle }}
            />
            <SettingsItem
              icon={<Moon className="w-5 h-5" />}
              title="Value Item"
              description="Shows current value"
              action={{ type: 'value', value: 'Dark', onClick: () => alert('Change value') }}
            />
            <SettingsItem
              icon={<LogOut className="w-5 h-5" />}
              title="Danger Item"
              description="Dangerous action"
              action={{ type: 'navigate', onClick: () => alert('Danger') }}
              variant="danger"
            />
          </div>
        </div>
      );
    };
    return <ItemDemo />;
  },
};

// SettingsSection Stories
export const SettingsSectionDefault: StoryObj<typeof SettingsSection> = {
  render: () => {
    const SectionDemo = () => {
      const [notify, setNotify] = React.useState(true);
      return (
        <div className="p-6 bg-background max-w-lg space-y-6">
          <SettingsSection title="Default Section">
            <SettingsItem
              icon={<Key className="w-5 h-5" />}
              title="Item One"
              description="First item description"
              action={{ type: 'navigate', onClick: () => {} }}
            />
            <SettingsItem
              icon={<Bell className="w-5 h-5" />}
              title="Item Two"
              description="Second item description"
              action={{ type: 'toggle', checked: notify, onChange: setNotify }}
            />
          </SettingsSection>

          <SettingsSection title="Danger Section" variant="danger">
            <SettingsItem
              icon={<LogOut className="w-5 h-5" />}
              title="Dangerous Action"
              description="This action cannot be undone"
              action={{ type: 'navigate', onClick: () => {} }}
              variant="danger"
            />
          </SettingsSection>
        </div>
      );
    };
    return <SectionDemo />;
  },
};
