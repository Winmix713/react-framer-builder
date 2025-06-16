
import { useState } from "react";
import { CommandInput } from "@/components/CommandInput";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { CodeOutput } from "@/components/CodeOutput";
import { Header } from "@/components/Header";
import { ProcessingService } from "@/services/processingService";
import { GeneratedFile } from "@/services/codeGenerator";
import { toast } from "@/hooks/use-toast";

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

  const processingService = new ProcessingService();

  const handleCommandSubmit = async (command: string) => {
    setCurrentCommand(command);
    setIsProcessing(true);
    setGeneratedComponents([]);
    setProcessingSteps([]);
    
    try {
      const result = await processingService.processFramerCommand(
        command,
        (steps) => setProcessingSteps(steps)
      );

      // Convert GeneratedFile[] to GeneratedComponent[]
      const components: GeneratedComponent[] = result.components
        .filter(file => file.type === 'tsx' || file.type === 'css')
        .map(file => ({
          name: file.name,
          code: file.content,
          type: file.type as 'tsx' | 'css'
        }));

      setGeneratedComponents(components);

      toast({
        title: "Komponensek generálva",
        description: `${result.summary.totalComponents} komponens sikeresen feldolgozva!`,
      });

    } catch (error) {
      console.error('Processing failed:', error);
      toast({
        title: "Feldolgozási hiba",
        description: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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
