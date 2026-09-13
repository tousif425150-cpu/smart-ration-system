import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, message, Typography } from 'antd';
import { UserAddOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { FamilyService, CreateFamilyRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const Families: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchFamilies = async (params?: any) => {
    setLoading(true);
    try {
      const response = await FamilyService.list(params);
      // The API returns { status: 'success', data: { items: [], ... } }
      const { data } = response as any;
      setFamilies(data.items || []);
    } catch (error) {
      message.error('Failed to fetch families');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const generateFamilyId = () => {
    const random = Math.floor(10000 + Math.random() * 90000);
    form.setFieldsValue({ familyId: `FAM${random}` });
  };

  const handleCreate = async (values: CreateFamilyRequest) => {
    try {
      await FamilyService.create(values);
      message.success('Family registered successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchFamilies();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to register family');
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
      dataIndex: 'headName',
      key: 'headName',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
    },
    {
      title: 'Members',
      dataIndex: '_count',
      key: 'members',
      render: (count: any) => count.members,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/families/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Family Management</Title>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => setIsModalOpen(true)}
        >
          Register New Family
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search by name or family ID"
            allowClear
            onSearch={(value) => fetchFamilies({ search: value })}
            style={{ width: 400 }}
            enterButton={<SearchOutlined />}
          />
        </div>
        <Table
          dataSource={families}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="Register New Family"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ memberCount: 1 }}
        >
          <Form.Item
            name="familyId"
            label="Family ID"
            rules={[{ required: true, message: 'Please input Family ID!' }]}
          >
            <Input
              placeholder="e.g., FAM12345"
              addonAfter={<Button type="link" size="small" onClick={generateFamilyId}>Generate</Button>}
            />
          </Form.Item>
          <Form.Item
            name="headName"
            label="Head Name"
            rules={[{ required: true, message: 'Please input Head Name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[{ required: true, message: 'Please input Mobile Number!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input Address!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="username"
              label="Login Username"
              rules={[{ required: true, message: 'Please input Username!' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Login Password"
              rules={[{ required: true, message: 'Please input Password!' }]}
              style={{ flex: 1 }}
            >
              <Input.Password />
            </Form.Item>
          </div>
          <Form.Item
            name="memberCount"
            label="Initial Member Count"
            rules={[{ required: true, message: 'Please input Member Count!' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Register Family
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Families;
