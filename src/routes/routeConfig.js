/**
 * Route configuration for the WINDSURFALFA application
 * Centralizes all route definitions for easier management
 */

import { ChatInterface } from '../components/shared/imports';
import Settings from '../components/settings/Settings';

// Define all application routes in one place
export const routes = [
  {
    path: '/',
    element: ChatInterface,
    title: 'Chat',
    icon: 'chat',
    exact: true,
  },
  {
    path: '/settings',
    element: Settings,
    title: 'Settings',
    icon: 'settings',
  }
];

// Utility to find a route by path
export const findRouteByPath = (path) => {
  return routes.find(route => route.path === path);
};

// Generate navigation items from routes
export const getNavigationItems = () => {
  return routes.map(route => ({
    path: route.path,
    title: route.title,
    icon: route.icon,
  }));
};
