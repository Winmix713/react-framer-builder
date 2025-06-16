
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Terminal } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isProcessing: boolean;
  currentCommand: string;
}

export const CommandInput = ({ onSubmit, isProcessing, currentCommand }: CommandInputProps) => {
  const [command, setCommand] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      toast({
        title: "Hiba",
        description: "Kérjük, adjon meg egy parancsot!",
        variant: "destructive"
      });
      return;
    }

    if (!command.includes("npx unframer@latest")) {
      toast({
        title: "Érvénytelen parancs",
        description: "A parancsnak 'npx unframer@latest' formátumúnak kell lennie!",
        variant: "destructive"
      });
      return;
    }

    onSubmit(command);
    toast({
      title: "Parancs elküldve",
      description: "A feldolgozás megkezdődött...",
    });
  };

  const exampleCommands = [
    "npx unframer@latest 31b274560e2d8cd9",
    "npx unframer@latest a8f2e1c9d4b7f6e3",
    "npx unframer@latest 9c3a1b5e7f2d8e4a"
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold">Parancs bevitele</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="npx unframer@latest [hash]"
            className="bg-gray-900 border-gray-600 text-white font-mono text-sm pl-4 pr-20"
            disabled={isProcessing}
          />
          <Button
            type="submit"
            disabled={isProcessing || !command.trim()}
            className="absolute right-1 top-1 h-8 px-3 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {currentCommand && (
          <div className="text-sm text-gray-400">
            <span className="text-green-400">Utolsó parancs:</span> {currentCommand}
          </div>
        )}
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Példa parancsok:</h3>
        <div className="space-y-2">
          {exampleCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => setCommand(cmd)}
              disabled={isProcessing}
              className="block w-full text-left text-sm font-mono bg-gray-900 hover:bg-gray-700 px-3 py-2 rounded border border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
