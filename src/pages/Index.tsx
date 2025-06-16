
import { Header } from "@/components/Header";
import { MainContent } from "@/components/MainContent";

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
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <MainContent />
    </div>
  );
};

export default Index;
