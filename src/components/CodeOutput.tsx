
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Eye, Code2 } from "lucide-react";
import { GeneratedComponent } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";

interface CodeOutputProps {
  components: GeneratedComponent[];
}

export const CodeOutput = ({ components }: CodeOutputProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const copyToClipboard = (code: string, filename: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Kód másolva",
      description: `${filename} kódja a vágólapra másolva!`,
    });
  };

  const downloadFile = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Fájl letöltve",
      description: `${filename} sikeresen letöltve!`,
    });
  };

  const getSyntaxHighlighting = (code: string, type: 'tsx' | 'css') => {
    // Simple syntax highlighting for demonstration
    if (type === 'tsx') {
      return code
        .replace(/(import|export|const|interface|React|return)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(className|href|onClick)/g, '<span class="text-blue-400">$1</span>')
        .replace(/(true|false|null|undefined)/g, '<span class="text-yellow-400">$1</span>')
        .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
        .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>');
    } else {
      return code
        .replace(/(\.[a-zA-Z-]+|#[a-zA-Z-]+)/g, '<span class="text-yellow-400">$1</span>')
        .replace(/(color|background|font-size|margin|padding|border|width|height)/g, '<span class="text-blue-400">$1</span>')
        .replace(/(linear-gradient|rgba|rgb|#[0-9a-fA-F]+)/g, '<span class="text-green-400">$1</span>')
        .replace(/(\/\*.*?\*\/)/gs, '<span class="text-gray-500">$1</span>');
    }
  };

  if (components.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Code2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Generált komponensek</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? 'Kód' : 'Előnézet'}
          </Button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex border-b border-gray-700 overflow-x-auto">
        {components.map((component, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-r border-gray-700 transition-colors ${
              activeTab === index
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            {component.name}
          </button>
        ))}
      </div>

      {/* Code/Preview Content */}
      <div className="relative">
        {isPreviewMode ? (
          <div className="p-6">
            <div className="bg-white rounded-lg overflow-hidden">
              <iframe
                srcDoc={`
                  <html>
                    <head>
                      <style>
                        ${components.find(c => c.type === 'css')?.code || ''}
                        body { margin: 0; font-family: Inter, sans-serif; }
                      </style>
                    </head>
                    <body>
                      <div class="framer-component">
                        <div class="hero-section">
                          <h1 class="hero-title">Welcome to your design</h1>
                          <p class="hero-subtitle">This component was automatically generated from your Framer design</p>
                          <button class="cta-button">Get Started</button>
                        </div>
                        <div class="features-grid">
                          <div class="feature-card">
                            <div class="feature-icon">🎨</div>
                            <h3>Beautiful Design</h3>
                            <p>Pixel-perfect implementation</p>
                          </div>
                          <div class="feature-card">
                            <div class="feature-icon">⚡</div>
                            <h3>Fast Performance</h3>
                            <p>Optimized for speed</p>
                          </div>
                          <div class="feature-card">
                            <div class="feature-icon">📱</div>
                            <h3>Responsive</h3>
                            <p>Works on all devices</p>
                          </div>
                        </div>
                      </div>
                    </body>
                  </html>
                `}
                className="w-full h-96 border border-gray-300 rounded"
                title="Component Preview"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(components[activeTab].code, components[activeTab].name)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadFile(components[activeTab].code, components[activeTab].name)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Code Display */}
            <div className="bg-gray-900 p-6 overflow-x-auto">
              <pre className="text-sm leading-relaxed">
                <code 
                  className="text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: getSyntaxHighlighting(components[activeTab].code, components[activeTab].type)
                  }}
                />
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="px-6 py-3 bg-gray-750 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <span>
            {components[activeTab].name} • {components[activeTab].code.split('\n').length} sor
          </span>
          <span>
            {components[activeTab].type.toUpperCase()} fájl
          </span>
        </div>
      </div>
    </div>
  );
};
