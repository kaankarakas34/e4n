import type { TrafficLightResponse, User, Referral, OneToOne, Visitor, CEU, Attendance } from '../../types';

export class TrafficLightService {
  private static readonly SCORE_THRESHOLDS = {
    GREEN: 80,
    YELLOW: 60,
    RED: 40,
  };

  private static readonly WEIGHTS = {
    REFERRALS: 0.25,      // 25% - Business referrals
    ONE_TO_ONES: 0.20,    // 20% - One-to-one meetings
    VISITORS: 0.20,       // 20% - Visitors brought
    ATTENDANCE: 0.20,     // 20% - Meeting attendance
    CEUS: 0.15,           // 15% - Continuing education
  };

  private static readonly TARGETS = {
    REFERRALS_PER_MONTH: 8,
    ONE_TO_ONES_PER_MONTH: 4,
    VISITORS_PER_MONTH: 2,
    ATTENDANCE_RATE: 0.95, // 95% attendance rate
    CEUS_PER_MONTH: 2,
  };

  /**
   * Calculate traffic light score for a member
   */
  static async calculateScore(
    userId: string,
    referrals: Referral[],
    oneToOnes: OneToOne[],
    visitors: Visitor[],
    ceus: CEU[],
    attendances: Attendance[]
  ): Promise<TrafficLightResponse> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Filter data for the last month
    const recentReferrals = referrals.filter(r => new Date(r.created_at) >= lastMonth);
    const recentOneToOnes = oneToOnes.filter(o => new Date(o.meeting_date) >= lastMonth);
    const recentVisitors = visitors.filter(v => new Date(v.visited_at) >= lastMonth);
    const recentCEUs = ceus.filter(c => new Date(c.completed_date) >= lastMonth);

    // Calculate individual scores
    const referralScore = this.calculateReferralScore(recentReferrals);
    const oneToOneScore = this.calculateOneToOneScore(recentOneToOnes);
    const visitorScore = this.calculateVisitorScore(recentVisitors);
    const attendanceScore = this.calculateAttendanceScore(attendances);
    const ceuScore = this.calculateCEUScore(recentCEUs);

    // Calculate weighted total score
    const totalScore = Math.round(
      referralScore * this.WEIGHTS.REFERRALS +
      oneToOneScore * this.WEIGHTS.ONE_TO_ONES +
      visitorScore * this.WEIGHTS.VISITORS +
      attendanceScore * this.WEIGHTS.ATTENDANCE +
      ceuScore * this.WEIGHTS.CEUS
    );

    const color = this.getColorFromScore(totalScore);
    const recommendations = this.generateRecommendations(
      totalScore,
      referralScore,
      oneToOneScore,
      visitorScore,
      attendanceScore,
      ceuScore
    );

    return {
      score: totalScore,
      color,
      breakdown: {
        referrals: referralScore,
        one_to_ones: oneToOneScore,
        visitors: visitorScore,
        education: ceuScore,
        attendances: attendanceScore,
      },
      recommendations,
    };
  }

  /**
   * Calculate referral score (0-100)
   */
  private static calculateReferralScore(referrals: Referral[]): number {
    const successfulReferrals = referrals.filter(r => r.status === 'SUCCESSFUL').length;
    const totalReferrals = referrals.length;

    if (totalReferrals === 0) return 0;

    const successRate = successfulReferrals / totalReferrals;
    const volumeScore = Math.min(totalReferrals / this.TARGETS.REFERRALS_PER_MONTH, 1);
    const qualityScore = successRate;

    return Math.round((volumeScore * 0.6 + qualityScore * 0.4) * 100);
  }

  /**
   * Calculate one-to-one meeting score (0-100)
   */
  private static calculateOneToOneScore(oneToOnes: OneToOne[]): number {
    const uniquePartners = new Set(oneToOnes.map(o => o.member2_id)).size;
    const totalMeetings = oneToOnes.length;

    const volumeScore = Math.min(totalMeetings / this.TARGETS.ONE_TO_ONES_PER_MONTH, 1);
    const diversityScore = Math.min(uniquePartners / 2, 1); // At least 2 different partners

    return Math.round((volumeScore * 0.7 + diversityScore * 0.3) * 100);
  }

  /**
   * Calculate visitor score (0-100)
   */
  private static calculateVisitorScore(visitors: Visitor[]): number {
    const attendedVisitors = visitors.filter(v => v.status === 'ATTENDED').length;
    const totalInvited = visitors.length;

    if (totalInvited === 0) return 0;

    const conversionRate = attendedVisitors / totalInvited;
    const volumeScore = Math.min(attendedVisitors / this.TARGETS.VISITORS_PER_MONTH, 1);

    return Math.round((volumeScore * 0.8 + conversionRate * 0.2) * 100);
  }

  /**
   * Calculate attendance score (0-100)
   */
  private static calculateAttendanceScore(attendances: Attendance[]): number {
    const recentAttendances = attendances.slice(-4); // Last 4 meetings

    if (recentAttendances.length === 0) return 0;

    const presentCount = recentAttendances.filter(a => a.status === 'PRESENT').length;
    const lateCount = recentAttendances.filter(a => a.status === 'LATE').length;
    const attendanceRate = (presentCount + lateCount * 0.5) / recentAttendances.length;

    return Math.round(Math.min(attendanceRate / this.TARGETS.ATTENDANCE_RATE, 1) * 100);
  }

  /**
   * Calculate CEU score (0-100)
   */
  private static calculateCEUScore(ceus: CEU[]): number {
    const totalHours = ceus.reduce((sum, ceu) => sum + ceu.hours, 0);
    const volumeScore = Math.min(totalHours / (this.TARGETS.CEUS_PER_MONTH * 2), 1); // 2 hours per CEU

    return Math.round(volumeScore * 100);
  }

  /**
   * Get color based on score
   */
  private static getColorFromScore(score: number): 'GREEN' | 'YELLOW' | 'RED' | 'GREY' {
    if (score >= this.SCORE_THRESHOLDS.GREEN) return 'GREEN';
    if (score >= this.SCORE_THRESHOLDS.YELLOW) return 'YELLOW';
    if (score >= this.SCORE_THRESHOLDS.RED) return 'RED';
    return 'GREY';
  }

  /**
   * Generate recommendations based on scores
   */
  private static generateRecommendations(
    totalScore: number,
    referralScore: number,
    oneToOneScore: number,
    visitorScore: number,
    attendanceScore: number,
    ceuScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (totalScore >= 90) {
      recommendations.push('🎉 Mükemmel performans! E4N standartlarını aşıyorsunuz.');
      recommendations.push('💡 Diğer üyelere mentorluk yapmayı düşünün.');
    } else if (totalScore >= 80) {
      recommendations.push('👏 Çok iyi! Hedeflerin üzerindesiniz.');
      recommendations.push('🎯 Mevcut stratejilerinizi sürdürün.');
    } else if (totalScore >= 60) {
      recommendations.push('📈 İyi yoldasınız, biraz daha fazla çaba gerekiyor.');
    } else {
      recommendations.push('🚨 Performansınızı artırmak için harekete geçin!');
    }

    // Specific recommendations based on individual scores
    if (referralScore < 60) {
      recommendations.push('🤝 Daha fazla iş yönlendirmesi yapın. Hedef: Ayda 8 yönlendirme.');
    }

    if (oneToOneScore < 60) {
      recommendations.push('☕ Daha fazla 1-to-1 görüşmesi planlayın. Hedef: Ayda 4 görüşme.');
    }

    if (visitorScore < 60) {
      recommendations.push('👥 Daha fazla ziyaretçi getirmeye çalışın. Hedef: Ayda 2 ziyaretçi.');
    }

    if (attendanceScore < 80) {
      recommendations.push('📅 Toplantılara düzenli katılmaya özen gösterin.');
    }

    if (ceuScore < 60) {
      recommendations.push('📚 Profesyonel gelişiminize odaklanın. Hedef: Ayda 2 CEU.');
    }

    return recommendations;
  }

  /**
   * Get color classes for UI styling
   */
  static getColorClasses(color: 'GREEN' | 'YELLOW' | 'RED' | 'GREY'): {
    bg: string;
    text: string;
    border: string;
    gradient: string;
  } {
    switch (color) {
      case 'GREEN':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          gradient: 'from-green-400 to-green-600',
        };
      case 'YELLOW':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          gradient: 'from-yellow-400 to-yellow-600',
        };
      case 'RED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          gradient: 'from-red-400 to-red-600',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          gradient: 'from-gray-400 to-gray-600',
        };
    }
  }
}

export default TrafficLightService;