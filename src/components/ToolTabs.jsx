import React from 'react';
import { ShieldCheck, Activity, Calculator, Bot } from 'lucide-react';
import LoanEligibilityTool from './tools/LoanEligibilityTool';
import CreditScoreTool from './tools/CreditScoreTool';
import EmiCalculatorTool from './tools/EmiCalculatorTool';
import AiTipsTool from './tools/AiTipsTool';

export default function ToolTabs({ activeTab, setActiveTab, contextData, onUpdateContext }) {
  const tabs = [
    { key: 'loan', label: 'Loan Eligibility', icon: ShieldCheck },
    { key: 'credit', label: 'Credit Score Analyzer', icon: Activity },
    { key: 'emi', label: 'EMI Calculator', icon: Calculator },
    { key: 'tips', label: 'AI Financial Tips', icon: Bot }
  ];

  return (
    <section id="tools-section" className="tool-tabs-container">
      <div className="container">
        {/* Tab Navigation */}
        <div className="tabs-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        {activeTab === 'loan' && <LoanEligibilityTool onUpdateContext={onUpdateContext} />}
        {activeTab === 'credit' && <CreditScoreTool onUpdateContext={onUpdateContext} />}
        {activeTab === 'emi' && <EmiCalculatorTool />}
        {activeTab === 'tips' && <AiTipsTool contextData={contextData} />}
      </div>
    </section>
  );
}
