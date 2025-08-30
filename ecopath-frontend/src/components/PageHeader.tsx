'use client';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: string;
  gradientColors?: string;
  onBackToHomepage?: () => void;
  showToolBadge?: boolean;
  toolBadgeText?: string;
  toolBadgeDescription?: string;
}

export default function PageHeader({
  title,
  description,
  icon,
  gradientColors = "from-green-500 to-blue-500",
  onBackToHomepage,
  showToolBadge = true,
  toolBadgeText = "Analytics Tool",
  toolBadgeDescription = "State-wide environmental insights"
}: PageHeaderProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-green-200/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${gradientColors} rounded-2xl flex items-center justify-center`}>
              <span className="text-3xl">{icon}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">{title}</h1>
              <p className="text-green-600 text-lg">{description}</p>
            </div>
          </div>
          
          {/* Right side - Back to Homepage button and Tool Badge */}
          <div className="flex items-center space-x-4">
            {/* Back to Homepage Button */}
            {onBackToHomepage && (
              <button
                onClick={onBackToHomepage}
                className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer border border-blue-200"
              >
                <span>🏠</span>
                <span>Back to Homepage</span>
              </button>
            )}
            
            {/* Tool Badge */}
            {showToolBadge && (
              <div className="text-right">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200 text-sm font-medium">
                  <span className="text-lg">🔍</span>
                  <span>{toolBadgeText}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{toolBadgeDescription}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
