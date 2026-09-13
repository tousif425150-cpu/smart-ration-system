import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Button, theme, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Families from './pages/Families';
import FamilyDetails from './pages/FamilyDetails';
import Distributions from './pages/Distributions';
import Settings from './pages/Settings';
import { useAuthStore } from './store/authStore';

const { Header, Sider, Content } = Layout;

const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          🌾 Smart Ration
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          items={[
            {
              key: '/dashboard',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              onClick: () => navigate('/dashboard'),
            },
            {
              key: '/families',
              icon: <TeamOutlined />,
              label: 'Families',
              onClick: () => navigate('/families'),
            },
            {
              key: '/distributions',
              icon: <HistoryOutlined />,
              label: 'Distributions',
              onClick: () => navigate('/distributions'),
            },
            {
              key: '/settings',
              icon: <SettingOutlined />,
              label: 'Settings',
              onClick: () => navigate('/settings'),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: token.colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ marginRight: 16 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            {admin?.username}
          </div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: token.colorBgContainer, borderRadius: token.borderRadiusLG, overflow: 'initial' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <PrivateLayout>{children}</PrivateLayout>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2e7d32',
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/families" element={<ProtectedRoute><Families /></ProtectedRoute>} />
          <Route path="/families/:id" element={<ProtectedRoute><FamilyDetails /></ProtectedRoute>} />
          <Route path="/distributions" element={<ProtectedRoute><Distributions /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
