
import { CommandInput } from "@/components/CommandInput";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { CodeOutput } from "@/components/CodeOutput";
import { HeroSection } from "@/components/HeroSection";
import { useProcessing } from "@/hooks/useProcessing";

export const MainContent = () => {
  const {
    isProcessing,
    processingSteps,
    generatedComponents,
    currentCommand,
    handleCommandSubmit
  } = useProcessing();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <HeroSection />

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
  );
};
