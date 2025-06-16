
import { useState } from "react";
import { CommandInput } from "@/components/CommandInput";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { CodeOutput } from "@/components/CodeOutput";
import { Header } from "@/components/Header";

export interface ProcessingStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description?: string;
}

export interface GeneratedComponent {
  name: string;
  code: string;
  type: 'tsx' | 'css';
}

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [generatedComponents, setGeneratedComponents] = useState<GeneratedComponent[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");

  const handleCommandSubmit = async (command: string) => {
    setCurrentCommand(command);
    setIsProcessing(true);
    setGeneratedComponents([]);
    
    // Initialize processing steps
    const steps: ProcessingStep[] = [
      { id: '1', title: 'Parsing Framer command', status: 'pending', description: 'Extracting hash and validating format' },
      { id: '2', title: 'Connecting to Framer API', status: 'pending', description: 'Fetching design data' },
      { id: '3', title: 'Analyzing component structure', status: 'pending', description: 'Breaking down layers and elements' },
      { id: '4', title: 'Generating React components', status: 'pending', description: 'Creating TSX and CSS files' },
      { id: '5', title: 'Optimizing code', status: 'pending', description: 'Applying best practices and cleanup' }
    ];
    
    setProcessingSteps(steps);

    // Simulate processing steps
    for (let i = 0; i < steps.length; i++) {
      // Set current step to processing
      setProcessingSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' } : step
      ));
      
      // Wait for simulation
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Complete current step
      setProcessingSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));

      // Generate components at the last step
      if (i === steps.length - 1) {
        const hash = command.split(' ').pop() || 'unknown';
        const componentName = `FramerComponent${hash.substring(0, 8)}`;
        
        const generatedCode = `import React from 'react';
import './${componentName}.css';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className = "" }) => {
  return (
    <div className={\`framer-component \${className}\`}>
      <div className="hero-section">
        <h1 className="hero-title">
          Welcome to your design
        </h1>
        <p className="hero-subtitle">
          This component was automatically generated from your Framer design
        </p>
        <button className="cta-button">
          Get Started
        </button>
      </div>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>Beautiful Design</h3>
          <p>Pixel-perfect implementation</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Fast Performance</h3>
          <p>Optimized for speed</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Responsive</h3>
          <p>Works on all devices</p>
        </div>
      </div>
    </div>
  );
};

export default ${componentName};`;

        const cssCode = `.framer-component {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  color: white;
  margin-bottom: 4rem;
  padding: 4rem 0;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  color: white;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-card p {
  opacity: 0.9;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .framer-component {
    padding: 1rem;
  }
}`;

        setGeneratedComponents([
          {
            name: `${componentName}.tsx`,
            code: generatedCode,
            type: 'tsx'
          },
          {
            name: `${componentName}.css`,
            code: cssCode,
            type: 'css'
          }
        ]);
      }
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Framer Export Processor
            </h1>
            <p className="text-xl text-gray-300">
              Automatikusan konvertálja a Framer designokat React komponensekké
            </p>
          </div>

          <CommandInput 
            onSubmit={handleCommandSubmit} 
            isProcessing={isProcessing}
            currentCommand={currentCommand}
          />

          {processingSteps.length > 0 && (
            <ProcessingStatus 
              steps={processingSteps}
              isProcessing={isProcessing}
            />
          )}

          {generatedComponents.length > 0 && (
            <CodeOutput components={generatedComponents} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
