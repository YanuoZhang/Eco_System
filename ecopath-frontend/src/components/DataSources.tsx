"use client";

import { useState } from "react";

interface DataSource {
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "ABS Census Data",
    description: "Australian Bureau of Statistics population and demographic data",
    url: "https://www.abs.gov.au/statistics/people/population",
    category: "Demographics",
    icon: "📊",
  },
  {
    name: "Department of Climate Change",
    description: "Official climate change and emissions reduction data",
    url: "https://www.dcceew.gov.au/climate-change",
    category: "Climate",
    icon: "🌱",
  },
  {
    name: "AEMO Emissions Data",
    description: "Australian Energy Market Operator energy and emissions data",
    url: "https://aemo.com.au/energy-systems/emissions",
    category: "Energy",
    icon: "⚡",
  },
  {
    name: "City of Melbourne Open Data",
    description: "Melbourne city environmental and sustainability data",
    url: "https://data.melbourne.vic.gov.au/",
    category: "Local Government",
    icon: "🏙️",
  },
  {
    name: "Bureau of Meteorology",
    description: "Weather and climate data for environmental analysis",
    url: "https://www.bom.gov.au/climate/",
    category: "Weather",
    icon: "🌤️",
  },
  {
    name: "CSIRO Climate Data",
    description: "Commonwealth Scientific and Industrial Research Organisation climate research",
    url: "https://www.csiro.au/en/research/natural-environment/climate",
    category: "Research",
    icon: "🔬",
  },
];

export default function DataSources() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSourceClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Data Sources Button */}
      <div className="text-center py-8">
        <button
          data-testid="data-sources-btn"
          onClick={openModal}
          className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors cursor-pointer border border-green-200 shadow-sm"
        >
          <span>📚</span>
          <span>Data Sources</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          data-testid="data-sources-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📚</span>
                  <div>
                    <h2 className="text-2xl font-bold">Data Sources</h2>
                    <p className="text-green-100">Official datasets used in our analysis</p>
                  </div>
                </div>
                <button
                  data-testid="modal-close-btn"
                  onClick={closeModal}
                  className="text-white hover:text-green-100 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DATA_SOURCES.map((source, index) => (
                  <div
                    key={index}
                    data-testid={`dataset-link-${index}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleSourceClick(source.url)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{source.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                            {source.name}
                          </h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {source.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <span>Open Dataset</span>
                          <span className="ml-2">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p>All data sources are official government and research institutions</p>
                <p className="mt-1">Click any dataset to verify the original source</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
