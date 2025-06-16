
import { useState } from "react";
import { ProcessingService } from "@/services/processingService";
import { ProcessingStep, GeneratedComponent } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";

export const useProcessing = () => {
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

  return {
    isProcessing,
    processingSteps,
    generatedComponents,
    currentCommand,
    handleCommandSubmit
  };
};
