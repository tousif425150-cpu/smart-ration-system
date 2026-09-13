import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Descriptions, Table, Tag, Button,
  Space, Modal, Form, Input, InputNumber, message, Divider, Tabs
} from 'antd';
import {
  UserOutlined, EditOutlined, PlusOutlined, DeleteOutlined,
  SafetyOutlined, CameraOutlined, BankOutlined, RightOutlined, LockOutlined
} from '@ant-design/icons';
import { FamilyService, MemberService, RiceService, Family, Member, RiceEntitlement } from '../services/api';
import dayjs from 'dayjs';
import Webcam from 'react-webcam';

const { Title, Text } = Typography;

const FamilyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [entitlement, setEntitlement] = useState<RiceEntitlement | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEntitlementModalOpen, setIsEntitlementModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isEditFamilyModalOpen, setIsEditFamilyModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [form] = Form.useForm();
  const [entitlementForm] = Form.useForm();
  const [familyForm] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  const webcamRef = useRef<Webcam>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const familyResp = await FamilyService.get(Number(id));
      const membersResp = await MemberService.list(Number(id));
      // RiceService.getEntitlement returns RiceEntitlement directly if service unwraps it
      // Let's assume the data structure from backend.
      const fData = (familyResp as any).data.family;
      const mData = (membersResp as any).data.members;

      setFamily(fData);
      setMembers(mData);
      setEntitlement(fData.riceEntitlement);
    } catch (error) {
      message.error('Failed to load family details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (values: any) => {
    try {
      await MemberService.create(Number(id), values);
      message.success('Member added successfully');
      setIsMemberModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleSetEntitlement = async (values: any) => {
    try {
      await RiceService.setEntitlement(Number(id), values);
      message.success('Entitlement updated successfully');
      setIsEntitlementModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error('Failed to update entitlement');
    }
  };

  const handleEditFamily = async (values: any) => {
    try {
      await FamilyService.update(Number(id), values);
      message.success('Family updated successfully');
      setIsEditFamilyModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error('Failed to update family');
    }
  };

  const handleResetPassword = async (values: any) => {
    try {
      await FamilyService.resetPassword(Number(id), values);
      message.success('Password reset successfully');
      setIsResetPasswordModalOpen(false);
      resetPasswordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteMember = (member: Member) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this member?',
      content: `Member: ${member.name}`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await MemberService.delete(member.id);
          message.success('Member deleted successfully');
          fetchData();
        } catch (error) {
          message.error('Failed to delete member');
        }
      },
    });
  };

  const captureFace = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc || !selectedMember) return;

    try {
      await MemberService.enrollFace(selectedMember.id, imageSrc);
      message.success('Face enrolled successfully');
      setIsFaceModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Face enrollment failed');
    }
  };

  const handleToggleMemberStatus = async (member: Member) => {
    try {
      const newStatus = member.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await MemberService.update(member.id, { accountStatus: newStatus });
      message.success(`Member ${newStatus.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      message.error('Failed to update member status');
    }
  };

  const memberColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string, record: any) => <span>{text} {record.isFamilyHead && <Tag color="blue">Head</Tag>}</span> },
    { title: 'Relation', dataIndex: 'relation', key: 'relation' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
    { title: 'Status', dataIndex: 'accountStatus', key: 'status', render: (status: string) => <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag> },
    { title: 'Face', dataIndex: 'faceEnrollmentStatus', key: 'face', render: (status: string) => <Tag color={status === 'ENROLLED' ? 'cyan' : 'orange'}>{status}</Tag> },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Member) => (
        <Space>
          <Button icon={<CameraOutlined />} onClick={() => { setSelectedMember(record); setIsFaceModalOpen(true); }}>Enroll Face</Button>
          <Button onClick={() => handleToggleMemberStatus(record)}>{record.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button>
          {!record.isFamilyHead && <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteMember(record)}>Delete</Button>}
        </Space>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={<Title level={3}>Family: {family?.familyId}</Title>}
            extra={
              <Space>
                <Button icon={<LockOutlined />} onClick={() => setIsResetPasswordModalOpen(true)}>Reset Login Password</Button>
                <Button icon={<EditOutlined />} onClick={() => { familyForm.setFieldsValue(family); setIsEditFamilyModalOpen(true); }}>Edit Family</Button>
              </Space>
            }
          >
            <Descriptions bordered>
              <Descriptions.Item label="Head Name">{family?.headName}</Descriptions.Item>
              <Descriptions.Item label="Login Username"><strong>{family?.username || 'N/A'}</strong></Descriptions.Item>
              <Descriptions.Item label="Mobile">{family?.mobileNumber}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={family?.isActive ? 'green' : 'red'}>{family?.isActive ? 'ACTIVE' : 'INACTIVE'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>{family?.address}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={16}>
          <Card title="Family Members" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsMemberModalOpen(true)}>Add Member</Button>}>
            <Table dataSource={members} columns={memberColumns} rowKey="id" pagination={false} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Rice Entitlement" extra={<Button icon={<EditOutlined />} onClick={() => setIsEntitlementModalOpen(true)}>Update</Button>}>
            {entitlement ? (
              <Descriptions column={1}>
                <Descriptions.Item label="Monthly Quota"><strong>{Number(entitlement.monthlyQuotaKg || 0)} KG</strong></Descriptions.Item>
                <Descriptions.Item label="Per Member Quota">{Number(entitlement.unitPerMemberKg || 0)} KG</Descriptions.Item>
                <Descriptions.Item label="Effective From">{dayjs(entitlement.effectiveFrom).format('DD MMM YYYY')}</Descriptions.Item>
              </Descriptions>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">No entitlement set</Text>
              </div>
            )}
            <Divider />
            <Button type="primary" block icon={<BankOutlined />} onClick={() => navigate('/distributions', { state: { familyId: family?.familyId } })}>Distribute Rice</Button>
          </Card>
        </Col>
      </Row>

      {/* Edit Family Modal */}
      <Modal title="Edit Family" open={isEditFamilyModalOpen} onCancel={() => setIsEditFamilyModalOpen(false)} footer={null}>
        <Form form={familyForm} layout="vertical" onFinish={handleEditFamily}>
          <Form.Item name="headName" label="Head Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Button type="default" onClick={() => familyForm.setFieldsValue({ isActive: !familyForm.getFieldValue('isActive') })}>
              {familyForm.getFieldValue('isActive') ? 'Active' : 'Inactive'}
            </Button>
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Update Family</Button></Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal title="Reset Family Login Password" open={isResetPasswordModalOpen} onCancel={() => setIsResetPasswordModalOpen(false)} footer={null}>
        <Form form={resetPasswordForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[{ required: true, message: 'Please input new password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block danger>Reset Password</Button></Form.Item>
        </Form>
      </Modal>

      {/* Member Modal */}
      <Modal title="Add Family Member" open={isMemberModalOpen} onCancel={() => setIsMemberModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="name" label="Member Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="age" label="Age"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="relation" label="Relation" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="gender" label="Gender"><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Add Member</Button></Form.Item>
        </Form>
      </Modal>

      {/* Entitlement Modal */}
      <Modal title="Update Rice Entitlement" open={isEntitlementModalOpen} onCancel={() => setIsEntitlementModalOpen(false)} footer={null}>
        <Form form={entitlementForm} layout="vertical" onFinish={handleSetEntitlement} initialValues={entitlement || {}}>
          <Form.Item name="monthlyQuotaKg" label="Monthly Total Quota (KG)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="unitPerMemberKg" label="Unit Per Member (KG)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Save Entitlement</Button></Form.Item>
        </Form>
      </Modal>

      {/* Face Modal */}
      <Modal title={`Enroll Face - ${selectedMember?.name}`} open={isFaceModalOpen} onCancel={() => setIsFaceModalOpen(false)} footer={null} width={500}>
        <div style={{ textAlign: 'center' }}>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
          <Button type="primary" size="large" icon={<CameraOutlined />} onClick={captureFace} style={{ marginTop: 24 }} block>Capture and Enroll</Button>
        </div>
      </Modal>
    </div>
  );
};

export default FamilyDetails;
