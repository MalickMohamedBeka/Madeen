import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

interface StatisticsData {
  userName: string;
  daysSinceInstall: number;
  installDate: string;
  currentStreak: number;
  bestStreak: number;
  totalHabitsCompleted: number;
  totalPrayersOnTime: number;
  totalQuranPages: number;
  successRate: number;
  completedCount: number;
  totalCount: number;
  avgHabitsPerDay: number;
  periodStats?: {
    totalHabits: number;
    totalPrayers: number;
    totalPages: number;
    daysWithActivity: number;
    perfectDays: number;
    avgHabits: number;
    avgPrayers: number;
    avgPages: number;
    activityRate: number;
  };
  selectedPeriod: 'week' | 'all';
}

const generateHTMLContent = (data: StatisticsData): string => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statistiques Madeen</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F7F3ED;
      padding: 40px 20px;
      color: #1A1A1A;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #0D4A3A;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #0D4A3A;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #6B7280;
      font-size: 16px;
    }
    .user-info {
      background: #F7F3ED;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .user-name {
      font-size: 24px;
      font-weight: 700;
      color: #0D4A3A;
      margin-bottom: 5px;
    }
    .user-date {
      color: #6B7280;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #F7F3ED;
      padding: 20px;
      border-radius: 12px;
      border: 2px solid #E5E0D8;
    }
    .stat-label {
      color: #6B7280;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .stat-value {
      color: #0D4A3A;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .stat-subtitle {
      color: #9CA3AF;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #0D4A3A;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #E5E0D8;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E5E0D8;
    }
    .info-label {
      color: #6B7280;
      font-weight: 500;
    }
    .info-value {
      color: #1A1A1A;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E0D8;
      color: #9CA3AF;
      font-size: 12px;
    }
    .highlight {
      background: rgba(212, 168, 75, 0.15);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .highlight-value {
      font-size: 48px;
      font-weight: 700;
      color: #0D4A3A;
      margin-bottom: 5px;
    }
    .highlight-label {
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🕌</div>
      <h1>Statistiques Madeen</h1>
      <p class="subtitle">Rapport généré le ${currentDate}</p>
    </div>

    ${data.userName ? `
    <div class="user-info">
      <div class="user-name">${data.userName}</div>
      <div class="user-date">Membre depuis ${data.daysSinceInstall} jour${data.daysSinceInstall > 1 ? 's' : ''}</div>
    </div>
    ` : ''}

    ${data.selectedPeriod === 'all' ? `
    <div class="section">
      <h2 class="section-title">Vue d'ensemble</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Série actuelle</div>
          <div class="stat-value">${data.currentStreak}</div>
          <div class="stat-subtitle">jours consécutifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Meilleure série</div>
          <div class="stat-value">${data.bestStreak}</div>
          <div class="stat-subtitle">jours consécutifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total habitudes</div>
          <div class="stat-value">${data.totalHabitsCompleted}</div>
          <div class="stat-subtitle">complétées</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Moyenne/jour</div>
          <div class="stat-value">${data.avgHabitsPerDay}</div>
          <div class="stat-subtitle">habitudes</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Prières</div>
          <div class="stat-value">${data.totalPrayersOnTime}</div>
          <div class="stat-subtitle">accomplies</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pages Coran</div>
          <div class="stat-value">${data.totalQuranPages}</div>
          <div class="stat-subtitle">lues</div>
        </div>
      </div>
    </div>
    ` : `
    <div class="section">
      <h2 class="section-title">Cette semaine</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Habitudes</div>
          <div class="stat-value">${data.periodStats?.totalHabits || 0}</div>
          <div class="stat-subtitle">Moy: ${data.periodStats?.avgHabits || 0}/j</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Jours actifs</div>
          <div class="stat-value">${data.periodStats?.daysWithActivity || 0}/7</div>
          <div class="stat-subtitle">${data.periodStats?.activityRate || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Prières</div>
          <div class="stat-value">${data.periodStats?.totalPrayers || 0}</div>
          <div class="stat-subtitle">Moy: ${data.periodStats?.avgPrayers || 0}/j</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pages Coran</div>
          <div class="stat-value">${data.periodStats?.totalPages || 0}</div>
          <div class="stat-subtitle">Moy: ${data.periodStats?.avgPages || 0}/j</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Jours parfaits</div>
          <div class="stat-value">${data.periodStats?.perfectDays || 0}</div>
          <div class="stat-subtitle">10+ habitudes</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Taux du jour</div>
          <div class="stat-value">${data.successRate}%</div>
          <div class="stat-subtitle">${data.completedCount}/${data.totalCount}</div>
        </div>
      </div>
    </div>
    `}

    <div class="section">
      <h2 class="section-title">Informations</h2>
      <div class="info-row">
        <span class="info-label">Date d'installation</span>
        <span class="info-value">${new Date(data.installDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Jours d'utilisation</span>
        <span class="info-value">${data.daysSinceInstall} jour${data.daysSinceInstall > 1 ? 's' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Série actuelle</span>
        <span class="info-value">${data.currentStreak} jour${data.currentStreak > 1 ? 's' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Meilleure série</span>
        <span class="info-value">${data.bestStreak} jour${data.bestStreak > 1 ? 's' : ''}</span>
      </div>
    </div>

    <div class="footer">
      <p>Madeen - Votre compagnon spirituel au quotidien</p>
      <p>Rapport généré automatiquement le ${currentDate}</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const exportStatisticsToPDF = async (data: StatisticsData): Promise<void> => {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
      return;
    }

    // Generate HTML content
    const htmlContent = generateHTMLContent(data);

    // Generate PDF from HTML
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Rename file to have .pdf extension
    const fileName = `Madeen_Statistiques_${new Date().toISOString().split('T')[0]}.pdf`;
    const newUri = FileSystem.cacheDirectory + fileName;
    
    // Move the file to cache directory with proper name
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    // Share the PDF file
    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exporter les statistiques',
    });

  } catch (error) {
    console.error('Error exporting statistics:', error);
    Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export des statistiques.');
  }
};
