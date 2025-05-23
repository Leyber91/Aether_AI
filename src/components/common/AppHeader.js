import React, { useState } from 'react';
import styles from './AppHeader.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, ROUTES } from '../../contexts/NavigationContext';
import ConversationHeader from '../Chat/components/ConversationHeader';
import { FiChevronDown, FiLogOut, FiUser, FiMessageCircle, FiEye, FiBarChart2, FiSettings, FiSliders } from 'react-icons/fi';
import HeaderFluidBg from './HeaderFluidBg';

// Animated logo with static, pulsing aura effect
const AnimatedLogo = () => (
  <div className={styles['logo-anim-container']}>
    <div className={styles['logo-aura']} />
    <img src={require('../../assets/aether-logo.png')} alt="Aether AI Logo" className={styles['logo']} />
  </div>
);

// Unified App Switcher & Navigation Bar
const ControlBar = ({ currentRoute, navigateTo }) => (
  <div className={styles['control-bar']}>
    <button
      className={currentRoute === ROUTES.CHAT ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.CHAT)}
      aria-label="Chat App"
      title="Chat"
    >
      <FiMessageCircle size={20} className={styles['nav-svg-icon']} />
      <span className={styles['nav-label']}>Chat</span>
    </button>
    <button
      className={currentRoute === ROUTES.CANVAS ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.CANVAS)}
      aria-label="Aether Canvas"
      title="Aether Canvas"
    >
      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={styles['nav-svg-icon']} height="20" width="20" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span className={styles['nav-label']}>Canvas</span>
    </button>
    <button
      className={currentRoute === ROUTES.VISION ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.VISION)}
      aria-label="Vision"
      title="Vision"
    >
      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={styles['nav-svg-icon']} height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      <span className={styles['nav-label']}>Vision</span>
    </button>
    <button className={styles['app-switch-btn']} disabled title="Coming Soon">
      <FiBarChart2 size={20} className={styles['nav-svg-icon']} />
      <span className={styles['nav-label']}>Data</span>
    </button>
    <button
      className={currentRoute === ROUTES.META_LOOP_LAB ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.META_LOOP_LAB)}
      aria-label="MetaLoopLab"
      title="MetaLoopLab"
    >
      <span className={styles['nav-icon']} role="img" aria-label="MetaLoopLab">🔁</span>
      <span className={styles['nav-label']}>MetaLoopLab</span>
    </button>
    <button
      className={currentRoute === ROUTES.AETHER_CREATOR ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.AETHER_CREATOR)}
      aria-label="AetherCreator"
      title="AetherCreator"
    >
      <FiSliders size={20} className={styles['nav-svg-icon']} />
      <span className={styles['nav-label']}>Creator</span>
    </button>
    <button
      className={currentRoute === ROUTES.SETTINGS ? styles['active-app'] : styles['app-switch-btn']}
      onClick={() => navigateTo(ROUTES.SETTINGS)}
      aria-label="Settings"
      title="Settings"
    >
      <FiSettings size={20} className={styles['nav-svg-icon']} />
      <span className={styles['nav-label']}>Settings</span>
    </button>
  </div>
);

// User avatar/profile dropdown with status dot and animation
const UserMenu = ({ user, logout }) => {
  const { navigateTo } = useNavigation();

  // Handles logout and redirects to login
  const handleLogout = async () => {
    await logout();
    navigateTo('login'); 
  };

  return (
    <div className={styles['header-right']}>
      <div className={styles['user-menu']}>
        <button className={styles['avatar-btn']} aria-label="User menu" tabIndex={0}>
          <span className={styles['avatar-icon']}><FiUser size={20} /></span>
          <span className={styles['user-name-gradient']}>{user?.name || 'User'}</span>
          <span className={styles['user-status-dot']} />
        </button>
        <button className={styles['icon-action']} disabled tabIndex={0}>
          <FiUser size={18} />
          <span className={styles['icon-label']}>Profile (soon)</span>
        </button>
        <button className={styles['icon-action']} onClick={handleLogout} tabIndex={0}>
          <FiLogOut size={18} />
          <span className={styles['icon-label']}>Logout</span>
        </button>
      </div>
    </div>
  );
};

const AppHeader = ({ conversationProps }) => {
  const { user, logout } = useAuth();
  const { currentRoute, navigateTo } = useNavigation();

  return (
    <header className={styles['App-header']}>
      <HeaderFluidBg />
      {/* Left: Animated Branding */}
      <div className={styles['header-left']}>
        <AnimatedLogo />
        <span className={styles['brand-title-gradient']}>Aether <span className={styles['brand-ai-gradient']}>AI</span></span>
      </div>
      {/* Center: Unified Control Bar & Chat Title */}
      <div className={styles['header-center']}>
        <ControlBar currentRoute={currentRoute} navigateTo={navigateTo} />
        {currentRoute === ROUTES.CHAT && conversationProps && (
          <div className={styles['chat-title-area']}>
            <ConversationHeader {...conversationProps} />
          </div>
        )}
      </div>
      {/* Right: User */}
      {user && <UserMenu user={user} logout={logout} />}
      {/* Nebula/particles background overlay */}
      <div className={styles['header-nebula-bg']} />
    </header>
  );
};

export default AppHeader;
