import type { ComponentType, JSX } from 'react';

import { MainPage } from '@/pages/MainPage/MainPage';
import { GoalsPage } from '@/pages/GoalsPage/GoalsPage';
import { StatisticsPage } from '@/pages/StatisticsPage/StatisticsPage';
interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: MainPage, title: 'Main' },
  { path: '/goals', Component: GoalsPage, title: 'Goals' },
  { path: '/statistics', Component: StatisticsPage, title: 'Statistics' },
];