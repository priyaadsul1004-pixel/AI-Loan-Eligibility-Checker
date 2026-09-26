import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import TrustSection from './components/TrustSection';
import ToolTabs from './components/ToolTabs';
import HistoryModal from './components/HistoryModal';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('loan');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contextData, setContextData] = useState({});

  const handleUpdateContext = (newContext) => {
    setContextData((prev) => ({
      ...prev,
      ...newContext
    }));
  };

  return (
    <div className="app-layout">
      {/* Sticky Top Nav */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <main>
        {/* Landing Hero Section with Proof Strip */}
        <Hero onSelectTool={setActiveTab} />

        {/* 3-Step Plainly Worded How It Works */}
        <HowItWorks />

        {/* Trust & Credibility Section */}
        <TrustSection />

        {/* The 4 Integrated Tools in Tabbed Glass Panel Interface */}
        <ToolTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          contextData={contextData}
          onUpdateContext={handleUpdateContext}
        />
      </main>

      {/* History Audit Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeTool={activeTab}
      />

      {/* Real Footer with Sitemap & Disclaimers */}
      <Footer onSelectTool={setActiveTab} />
    </div>
  );
}
