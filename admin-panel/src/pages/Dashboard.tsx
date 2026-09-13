import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, message, Button, Space } from 'antd';
import { TeamOutlined, ShoppingCartOutlined, UserAddOutlined, DashboardOutlined, NotificationOutlined } from '@ant-design/icons';
import { ReportService, NotificationService, DashboardStats, Transaction } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchData = async () => {
    try {
      const response = await ReportService.dashboard();
      const { data } = response as any;
      setStats(data);
      setRecentTransactions(data.recentTransactions || []);
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const resp = await NotificationService.sendMonthlyReminders();
      message.success(resp.message);
    } catch (error) {
      message.error('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const columns = [
    {
      title: 'Family ID',
      dataIndex: 'familyId',
      key: 'familyId',
    },
    {
      title: 'Head Name',
      dataIndex: 'familyHeadName',
      key: 'familyHeadName',
    },
    {
      title: 'Qty (KG)',
      dataIndex: 'distributedKg',
      key: 'distributedKg',
      render: (val: number) => <strong>{val} KG</strong>,
    },
    {
      title: 'Date & Time',
      dataIndex: 'distributionDate',
      key: 'distributionDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
        <Button
          type="primary"
          icon={<NotificationOutlined />}
          loading={sendingReminders}
          onClick={handleSendReminders}
        >
          Send Monthly Reminders
        </Button>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Families"
              value={stats?.totalFamilies || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f51b5' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Members"
              value={stats?.totalMembers || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#118dff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Distributed Today"
              value={stats?.totalRiceDistributedTodayKg || 0}
              suffix="KG"
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#2e7d32' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Monthly Distribution"
              value={stats?.totalRiceDistributedMonthKg || 0}
              suffix="KG"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#ed6c02' }}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Recent Transactions" loading={loading}>
            <Table
              dataSource={recentTransactions}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
