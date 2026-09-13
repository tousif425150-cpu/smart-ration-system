import React, { useEffect, useState } from 'react';
import { Card, Switch, Typography, List, message, Divider, Space, Button } from 'antd';
import { SafetyCertificateOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    isFaceVerificationRequiredForDistribution: true,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      if (response.data.status === 'success') {
        setSettings(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      const response = await api.patch('/admin/settings', {
        isFaceVerificationRequiredForDistribution: checked,
      });
      if (response.data.status === 'success') {
        setSettings({ ...settings, isFaceVerificationRequiredForDistribution: checked });
        message.success('Settings updated successfully');
      }
    } catch (error) {
      message.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>
        <SettingOutlined /> System Settings
      </Title>
      <Text type="secondary">Configure global security and ration distribution rules.</Text>

      <Divider />

      <Card loading={loading}>
        <List itemLayout="horizontal">
          <List.Item
            actions={[
              <Switch
                checked={settings.isFaceVerificationRequiredForDistribution}
                onChange={handleToggle}
                loading={saving}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />,
            ]}
          >
            <List.Item.Meta
              avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title="Face Verification for Distribution"
              description="When enabled, members must undergo real-time face verification before receiving their rice ration. This setting is enforced by the backend."
            />
          </List.Item>
        </List>
      </Card>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button icon={<ReloadOutlined />} onClick={fetchSettings}>Refresh Settings</Button>
      </div>
    </div>
  );
};

export default Settings;
