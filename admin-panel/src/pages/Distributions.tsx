import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, message, Typography, InputNumber } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { RiceService, DistributeRiceRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Distributions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();
  const initialFamilyId = location.state?.familyId || '';

  const fetchHistory = async (familyId?: string) => {
    setLoading(true);
    try {
      const response = await RiceService.history(familyId as any);
      const { data } = response as any;
      setHistory(data.distributions || []);
    } catch (error) {
      message.error('Failed to fetch distribution history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(initialFamilyId);
    if (initialFamilyId) {
      setIsModalOpen(true);
      form.setFieldsValue({ familyId: initialFamilyId });
    }
  }, [initialFamilyId]);

  const handleDistribute = async (values: DistributeRiceRequest) => {
    try {
      await RiceService.distribute(values);
      message.success('Rice distributed successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchHistory();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to distribute rice');
    }
  };

  const columns = [
    { title: 'Family ID', dataIndex: 'familyId', key: 'familyId' },
    { title: 'Head Name', dataIndex: 'familyHeadName', key: 'headName' },
    { title: 'Qty (KG)', dataIndex: 'distributedKg', key: 'distributedKg', render: (val: number) => <strong>{val} KG</strong> },
    { title: 'Remaining', dataIndex: 'remainingKg', key: 'remainingKg', render: (val: number) => <span>{val} KG</span> },
    { title: 'Date', dataIndex: 'distributionDate', key: 'date', render: (date: string) => dayjs(date).format('DD MMM YYYY, HH:mm') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="green">{status}</Tag> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Rice Distribution</Title>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          size="large"
          onClick={() => setIsModalOpen(true)}
        >
          New Distribution
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Filter by Family ID"
            allowClear
            defaultValue={initialFamilyId}
            onSearch={(value) => fetchHistory(value)}
            style={{ width: 400 }}
            enterButton={<SearchOutlined />}
          />
        </div>
        <Table
          dataSource={history}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="New Rice Distribution"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDistribute}
        >
          <Form.Item
            name="familyId"
            label="Family ID"
            rules={[{ required: true, message: 'Please input Family ID!' }]}
          >
            <Input placeholder="FAMXXXXX" />
          </Form.Item>
          <Form.Item
            name="distributedKg"
            label="Quantity to Distribute (KG)"
            rules={[{ required: true, message: 'Please input Quantity!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0.5} step={0.5} />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Complete Distribution
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Distributions;
