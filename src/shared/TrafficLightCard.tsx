import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { AlertTriangle, TrendingUp, Users, Calendar, BookOpen, RefreshCw } from 'lucide-react';
import { TrafficLightService } from '../utils/services/trafficLightService';
import type { TrafficLightResponse } from '../types';

interface TrafficLightCardProps {
  trafficLight: TrafficLightResponse | null;
  isLoading: boolean;
  userName: string;
  onRefresh?: () => void;
}

export function TrafficLightCard({
  trafficLight,
  isLoading,
  userName,
  onRefresh
}: TrafficLightCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Trafik Işığı Performans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trafficLight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Trafik Işığı Performans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Performans verileri yüklenemedi</p>
            <Button onClick={onRefresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yeniden Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { score, color, breakdown, recommendations } = trafficLight;
  const colorClasses = TrafficLightService.getColorClasses(color);

  const getColorEmoji = () => {
    switch (color) {
      case 'GREEN': return '🟢';
      case 'YELLOW': return '🟡';
      case 'RED': return '🔴';
      default: return '⚪';
    }
  };

  const getColorText = () => {
    switch (color) {
      case 'GREEN': return 'Mükemmel';
      case 'YELLOW': return 'İyi';
      case 'RED': return 'İyileştirme Gerekli';
      default: return 'Beklemede';
    }
  };

  return (
    <Card className={`${colorClasses.bg} ${colorClasses.border} border-2`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`text-xl ${colorClasses.text}`}>
              {getColorEmoji()} Trafik Işığı Performans
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {userName} için performans değerlendirmesi
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${colorClasses.gradient} text-white text-3xl font-bold shadow-lg`}>
            {score}
          </div>
          <p className={`mt-2 text-lg font-semibold ${colorClasses.text}`}>
            {getColorText()}
          </p>
          <p className="text-sm text-gray-600">
            Son 30 günün performansı
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{breakdown.referrals}%</span>
            </div>
            <p className="text-xs text-gray-600">Yönlendirmeler</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{breakdown.one_to_ones}%</span>
            </div>
            <p className="text-xs text-gray-600">1-to-1 Görüşmeler</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">{breakdown.visitors}%</span>
            </div>
            <p className="text-xs text-gray-600">Ziyaretçiler</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">{breakdown.attendances}%</span>
            </div>
            <p className="text-xs text-gray-600">Katılım</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-indigo-600 mr-2" />
              <span className="text-sm">CEU Puanı</span>
            </div>
            <span className="text-sm font-medium">{breakdown.education}%</span>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-3">Öneriler</h4>
            <ul className="space-y-2">
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
            {recommendations.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                +{recommendations.length - 3} daha fazla öneri
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}