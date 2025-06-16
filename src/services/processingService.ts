
import { FramerApiClient, FramerDesignData } from './framerApi';
import { DesignProcessor, ProcessingResult } from './designProcessor';
import { ProcessingStep } from '@/pages/Index';

export class ProcessingService {
  private framerApi: FramerApiClient;

  constructor() {
    this.framerApi = new FramerApiClient();
  }

  async processFramerCommand(
    command: string,
    onStepUpdate: (steps: ProcessingStep[]) => void
  ): Promise<ProcessingResult> {
    const hash = this.extractHashFromCommand(command);
    
    if (!hash) {
      throw new Error('Invalid command format');
    }

    const steps: ProcessingStep[] = [
      { id: '1', title: 'Parsing Framer command', status: 'pending', description: 'Extracting hash and validating format' },
      { id: '2', title: 'Connecting to Framer API', status: 'pending', description: 'Fetching design data' },
      { id: '3', title: 'Analyzing component structure', status: 'pending', description: 'Breaking down layers and elements' },
      { id: '4', title: 'Generating React components', status: 'pending', description: 'Creating TSX and CSS files' },
      { id: '5', title: 'Optimizing code', status: 'pending', description: 'Applying best practices and cleanup' }
    ];

    try {
      // Step 1: Parse command
      onStepUpdate(this.updateStepStatus(steps, '1', 'processing'));
      await this.delay(1000);
      
      const isValidHash = await this.framerApi.validateHash(hash);
      if (!isValidHash) {
        throw new Error('Invalid hash format');
      }
      
      onStepUpdate(this.updateStepStatus(steps, '1', 'completed'));

      // Step 2: Fetch design data
      onStepUpdate(this.updateStepStatus(steps, '2', 'processing'));
      await this.delay(1500);
      
      const designData = await this.framerApi.fetchDesignData(hash);
      onStepUpdate(this.updateStepStatus(steps, '2', 'completed'));

      // Step 3: Analyze structure
      onStepUpdate(this.updateStepStatus(steps, '3', 'processing'));
      await this.delay(1200);
      
      const processor = new DesignProcessor(designData);
      onStepUpdate(this.updateStepStatus(steps, '3', 'completed'));

      // Step 4: Generate components
      onStepUpdate(this.updateStepStatus(steps, '4', 'processing'));
      await this.delay(2000);
      
      const result = await processor.processDesign();
      onStepUpdate(this.updateStepStatus(steps, '4', 'completed'));

      // Step 5: Optimize
      onStepUpdate(this.updateStepStatus(steps, '5', 'processing'));
      await this.delay(800);
      
      // Optimization logic would go here
      onStepUpdate(this.updateStepStatus(steps, '5', 'completed'));

      return result;
    } catch (error) {
      console.error('Processing failed:', error);
      
      // Mark current step as error
      const currentStep = steps.find(step => step.status === 'processing');
      if (currentStep) {
        onStepUpdate(this.updateStepStatus(steps, currentStep.id, 'error'));
      }
      
      throw error;
    }
  }

  private extractHashFromCommand(command: string): string | null {
    const parts = command.trim().split(' ');
    return parts[parts.length - 1] || null;
  }

  private updateStepStatus(steps: ProcessingStep[], stepId: string, status: ProcessingStep['status']): ProcessingStep[] {
    return steps.map(step => 
      step.id === stepId ? { ...step, status } : step
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
