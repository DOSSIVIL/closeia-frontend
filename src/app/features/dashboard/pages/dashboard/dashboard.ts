import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StatCard {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  color: 'blue' | 'sage' | 'sand' | 'coral';
}

interface School {
  id: number;
  name: string;
  users: number;
  documents: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'document' | 'user' | 'school' | 'conversation';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  // Stats principales
  stats = signal<StatCard[]>([
    { label: 'Écoles actives', value: 12, change: 8.5, trend: 'up', icon: 'school', color: 'blue' },
    { label: 'Utilisateurs', value: 2847, change: 12.3, trend: 'up', icon: 'users', color: 'sage' },
    { label: 'Documents', value: 15420, change: 4.2, trend: 'up', icon: 'document', color: 'sand' },
    { label: 'Conversations', value: 8934, change: -2.1, trend: 'down', icon: 'chat', color: 'coral' },
  ]);

  // Écoles récentes
  schools = signal<School[]>([
    { id: 1, name: 'École Saint Jean', users: 450, documents: 3200, status: 'active', createdAt: '2026-01-15' },
    { id: 2, name: 'Collège du Sacré-Cœur', users: 320, documents: 2100, status: 'active', createdAt: '2026-02-03' },
    { id: 3, name: 'Lycée Technique', users: 280, documents: 1800, status: 'active', createdAt: '2026-02-20' },
    { id: 4, name: 'Institut Supérieur', users: 150, documents: 950, status: 'inactive', createdAt: '2026-03-10' },
  ]);

  // Activités récentes
  activities = signal<Activity[]>([
    { id: 1, user: 'Marie Dupont', action: 'a importé', target: 'Guide_Pedagogique_2026.pdf', time: 'Il y a 5 min', type: 'document' },
    { id: 2, user: 'Admin Système', action: "a créé l'école", target: 'Collège Saint Marc', time: 'Il y a 12 min', type: 'school' },
    { id: 3, user: 'Jean Kabongo', action: 'a rejoint', target: 'École Saint Jean', time: 'Il y a 25 min', type: 'user' },
    { id: 4, user: 'Sophie Martin', action: 'a démarré une conversation', target: "Procédure d'inscription", time: 'Il y a 1 h', type: 'conversation' },
    { id: 5, user: 'Pierre Nguema', action: 'a mis à jour', target: 'Règlement_Intérieur_v3.pdf', time: 'Il y a 2 h', type: 'document' },
  ]);

  // Données pour le graphique (7 derniers jours)
  chartData = signal<number[]>([42, 58, 35, 67, 89, 72, 95]);
  chartLabels = signal<string[]>(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);

  // Calculs
  maxChartValue = computed(() => Math.max(...this.chartData()));
  totalUsers = computed(() => this.schools().reduce((sum, s) => sum + s.users, 0));
  activeSchools = computed(() => this.schools().filter(s => s.status === 'active').length);

  getColorClasses(color: string): { bg: string; text: string; gradient: string } {
    const colors: Record<string, { bg: string; text: string; gradient: string }> = {
      blue: { bg: 'bg-[#93C5FD]/20', text: 'text-[#6BA3E0]', gradient: 'from-[#93C5FD] to-[#6BA3E0]' },
      sage: { bg: 'bg-[#99D8C9]/20', text: 'text-[#6BAE9E]', gradient: 'from-[#99D8C9] to-[#6BAE9E]' },
      sand: { bg: 'bg-[#D6BFA3]/20', text: 'text-[#B89B7A]', gradient: 'from-[#D6BFA3] to-[#B89B7A]' },
      coral: { bg: 'bg-[#E4574C]/20', text: 'text-[#C94A40]', gradient: 'from-[#E4574C] to-[#C94A40]' },
    };
    return colors[color] || colors['blue'];
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      document: '📄',
      user: '👤',
      school: '🏫',
      conversation: '💬',
    };
    return icons[type] || '📌';
  }
}