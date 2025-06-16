
import { FramerDesignData, FramerComponent } from './framerApi';
import { CodeGenerator, GeneratedFile } from './codeGenerator';

export interface ProcessingResult {
  components: GeneratedFile[];
  summary: ProcessingSummary;
}

export interface ProcessingSummary {
  totalComponents: number;
  generatedFiles: number;
  designTokensExtracted: number;
  assetsProcessed: number;
}

export class DesignProcessor {
  private codeGenerator: CodeGenerator;

  constructor(private designData: FramerDesignData) {
    this.codeGenerator = new CodeGenerator(designData.designTokens);
  }

  async processDesign(): Promise<ProcessingResult> {
    console.log('Starting design processing...');
    
    const allGeneratedFiles: GeneratedFile[] = [];
    
    // Process each component
    for (const component of this.designData.components) {
      const componentFiles = this.codeGenerator.generateComponent(component);
      allGeneratedFiles.push(...componentFiles);
    }

    // Generate design tokens file
    const tokensFile = this.generateDesignTokensFile();
    allGeneratedFiles.push(tokensFile);

    // Generate index file
    const indexFile = this.generateIndexFile();
    allGeneratedFiles.push(indexFile);

    const summary: ProcessingSummary = {
      totalComponents: this.designData.components.length,
      generatedFiles: allGeneratedFiles.length,
      designTokensExtracted: Object.keys(this.designData.designTokens.colors).length +
                            Object.keys(this.designData.designTokens.typography).length,
      assetsProcessed: this.designData.assets.length
    };

    return {
      components: allGeneratedFiles,
      summary
    };
  }

  private generateDesignTokensFile(): GeneratedFile {
    const tokens = this.designData.designTokens;
    
    const content = `// Design tokens extracted from Framer
export const designTokens = {
  colors: {
${Object.entries(tokens.colors).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
  typography: {
${Object.entries(tokens.typography).map(([key, value]) => 
  `    ${key}: {
      fontSize: ${value.fontSize},
      fontWeight: ${value.fontWeight},
      lineHeight: ${value.lineHeight},
      fontFamily: '${value.fontFamily}',
    },`
).join('\n')}
  },
  spacing: {
${Object.entries(tokens.spacing).map(([key, value]) => `    ${key}: ${value},`).join('\n')}
  },
  borderRadius: {
${Object.entries(tokens.borderRadius).map(([key, value]) => `    ${key}: ${value},`).join('\n')}
  },
} as const;

export type DesignTokens = typeof designTokens;`;

    return {
      name: 'designTokens.ts',
      content,
      type: 'types'
    };
  }

  private generateIndexFile(): GeneratedFile {
    const componentNames = this.designData.components.map(c => 
      c.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[a-z]/, (match) => match.toUpperCase())
    );

    const content = `// Auto-generated index file
${componentNames.map(name => `export { default as ${name} } from './${name}';`).join('\n')}
export { designTokens } from './designTokens';
export type { DesignTokens } from './designTokens';`;

    return {
      name: 'index.ts',
      content,
      type: 'types'
    };
  }
}
