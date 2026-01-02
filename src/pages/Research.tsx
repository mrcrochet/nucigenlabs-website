/**
 * PHASE 2D: Research Page
 * 
 * Role: Long-form intelligence
 * Case studies, thematic analysis
 * Premium / institutional content
 */

import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { BookOpen } from 'lucide-react';

function ResearchContent() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Research — Nucigen Labs"
        description="Long-form intelligence and case studies"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Research"
              subtitle="Thematic analysis and case studies"
            />
          </div>
        </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-16 w-full">
        <Card className="p-16 text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-20 h-20 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-3xl font-light text-white mb-6">
              Research & Analysis
            </h2>
            <p className="text-base text-slate-300 font-light leading-relaxed mb-8">
              This module will provide deep-dive case studies and thematic analysis based on multiple events, helping you understand patterns and long-term implications.
            </p>
            <p className="text-sm text-slate-500 font-light">
              Premium content coming soon.
            </p>
          </div>
        </Card>
      </main>
      </div>
    </div>
  );
}

export default function Research() {
  return (
    <ProtectedRoute>
      <ResearchContent />
    </ProtectedRoute>
  );
}

