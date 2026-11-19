import React from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Lock,
  MapPin,
  MessageSquare,
  Smartphone,
  Users,
} from 'lucide-react';
import type { FeatureItem } from '../../data/marketingContent';

const ICON_MAP = {
  Building2,
  ClipboardCheck,
  Smartphone,
  Clock,
  MapPin,
  BookOpen,
  AlertTriangle,
  FileCheck2,
  Users,
  MessageSquare,
  Activity,
  Lock,
};

export function FeatureIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: FeatureItem['iconName'];
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} />;
}
