/**
 * ResearchTemplates - Templates for common research queries
 * 
 * Templates:
 * - Country Risk Analysis
 * - Sector Outlook
 * - Company Exposure
 */

import { useState } from 'react';
import { MapPin, Building2, TrendingUp, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface ResearchTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  queryTemplate: string;
  category: 'country' | 'sector' | 'company';
}

interface ResearchTemplatesProps {
  onSelectTemplate: (query: string) => void;
}

const templates: ResearchTemplate[] = [
  {
    id: 'country-risk',
    title: 'Country Risk Analysis',
    description: 'Comprehensive risk assessment for a specific country',
    icon: <MapPin className="w-5 h-5" />,
    queryTemplate: 'Country risk analysis for {country}: geopolitical stability, economic outlook, security threats, and investment climate',
    category: 'country',
  },
  {
    id: 'sector-outlook',
    title: 'Sector Outlook',
    description: 'Industry trends, opportunities, and risks',
    icon: <Building2 className="w-5 h-5" />,
    queryTemplate: '{sector} sector outlook: current trends, growth drivers, key risks, and market dynamics',
    category: 'sector',
  },
  {
    id: 'company-exposure',
    title: 'Company Exposure',
    description: 'Geopolitical and market exposure analysis for a company',
    icon: <TrendingUp className="w-5 h-5" />,
    queryTemplate: '{company} exposure analysis: geopolitical risks, supply chain vulnerabilities, market dependencies, and regional exposure',
    category: 'company',
  },
];

export default function ResearchTemplates({ onSelectTemplate }: ResearchTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'country' | 'sector' | 'company'>('all');
  const [templateInputs, setTemplateInputs] = useState<Record<string, string>>({});

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateClick = (template: ResearchTemplate) => {
    // For now, use the template as-is (user can edit)
    // In future, could show a modal to fill in {country}, {sector}, {company}
    let query = template.queryTemplate;
    
    // Replace placeholders if available
    const input = templateInputs[template.id];
    if (input) {
      if (template.category === 'country') {
        query = query.replace('{country}', input);
      } else if (template.category === 'sector') {
        query = query.replace('{sector}', input);
      } else if (template.category === 'company') {
        query = query.replace('{company}', input);
      }
    } else {
      // Remove placeholders if no input
      query = query.replace(/\{[^}]+\}/g, '');
    }

    onSelectTemplate(query);
  };

  return (
    <Card>
      <SectionHeader title="Research Templates" />
      
      <div className="space-y-4 mt-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', 'country', 'sector', 'company'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-red/20 text-primary-red border border-primary-red/30'
                  : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium hover:bg-background-glass-medium transition-colors cursor-pointer"
              onClick={() => handleTemplateClick(template)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary-red/10 rounded-lg text-primary-red">
                  {template.icon}
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {template.title}
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                {template.description}
              </p>
              
              {/* Input field for template variables */}
              <input
                type="text"
                placeholder={
                  template.category === 'country' ? 'Enter country...' :
                  template.category === 'sector' ? 'Enter sector...' :
                  'Enter company...'
                }
                value={templateInputs[template.id] || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  setTemplateInputs(prev => ({
                    ...prev,
                    [template.id]: e.target.value,
                  }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1.5 text-xs bg-background-glass-medium border border-borders-subtle rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium"
              />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateClick(template);
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-primary-red/10 hover:bg-primary-red/20 text-primary-red rounded transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
