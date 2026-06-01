export type ThemeType = 'light' | 'dark' | 'highlight';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  white: string;
  text: string;
  textSecondary: string;
  accent: string;
  warning: string;
  error: string;
  border: string;
  shadow: string;
  timerBackground: string;
  moon: string;
  water: string;
  bloodPressure: string;
  cardTitle: string;
  qualityStar: string;
  timerRunning: string;
  timerPaused: string;
  timerStopped: string;
  inputBackground: string;
  chartSecondary: string;
  bmiIdeal: string;
  bmiWarning: string;
  bmiDanger: string;
}

export const Themes: Record<ThemeType, ThemeColors> = {
  light: {
    primary: '#0052D4',
    primaryLight: '#4389F1',
    background: '#F8F9FB',
    white: '#FFFFFF',
    text: '#1C1C1C',
    textSecondary: '#7D7D7D',
    accent: '#2ECC71',
    warning: '#E74C3C',
    error: '#E74C3C',
    border: '#EAEAEA',
    shadow: '#000000',
    timerBackground: '#F0F4F8',
    moon: '#6366F1',
    water: '#2196F3',
    bloodPressure: '#8E6E53',
    cardTitle: '#002244',
    qualityStar: '#F1C40F',
    timerRunning: '#F1F5F9',
    timerPaused: '#6366F115',
    timerStopped: '#94A3B8',
    inputBackground: '#F5F7FA',
    chartSecondary: '#EAEAEA',
    bmiIdeal: '#4CAF50',
    bmiWarning: '#FF9800',
    bmiDanger: '#F44336',
  },
  dark: {
    primary: '#1A73E8', // Azul Forte
    primaryLight: '#4285F4',
    background: '#121212',
    white: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    accent: '#F1C40F', // Amarelo
    warning: '#E74C3C',
    error: '#E74C3C',
    border: '#333333',
    shadow: '#000000',
    timerBackground: '#1F2937',
    moon: '#818CF8',
    water: '#64B5F6',
    bloodPressure: '#A8907E',
    cardTitle: '#E2E8F0',
    qualityStar: '#F1C40F',
    timerRunning: '#2D3748',
    timerPaused: '#1A73E830',
    timerStopped: '#718096',
    inputBackground: '#2D3748',
    chartSecondary: '#4A5568',
    bmiIdeal: '#4CAF50',
    bmiWarning: '#FFB74D',
    bmiDanger: '#E57373',
  },
  highlight: {
    primary: '#F1C40F', // Amarelo Destaque
    primaryLight: '#F39C12',
    background: '#FFFFFF',
    white: '#FFFFFF',
    text: '#1C1C1C',
    textSecondary: '#7D7D7D',
    accent: '#F1C40F',
    warning: '#E74C3C',
    error: '#E74C3C',
    border: '#EAEAEA',
    shadow: '#000000',
    timerBackground: '#FFF9E6',
    moon: '#F1C40F',
    water: '#2196F3',
    bloodPressure: '#F39C12',
    cardTitle: '#1C1C1C',
    qualityStar: '#F1C40F',
    timerRunning: '#FFF9E6',
    timerPaused: '#F1C40F30',
    timerStopped: '#7D7D7D',
    inputBackground: '#FFFDF0',
    chartSecondary: '#EAEAEA',
    bmiIdeal: '#4CAF50',
    bmiWarning: '#F39C12',
    bmiDanger: '#E74C3C',
  },
};

// Mantendo suporte para o código legado que importa Colors diretamente
export const Colors = Themes.light;

