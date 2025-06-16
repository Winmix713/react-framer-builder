
import { FramerComponent, DesignTokens, ComponentStyles } from './framerApi';

export interface GeneratedFile {
  name: string;
  content: string;
  type: 'tsx' | 'css' | 'types';
}

export class CodeGenerator {
  constructor(private designTokens: DesignTokens) {}

  generateComponent(component: FramerComponent): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Generate TypeScript component
    files.push({
      name: `${component.name}.tsx`,
      content: this.generateTSXComponent(component),
      type: 'tsx'
    });

    // Generate CSS module
    files.push({
      name: `${component.name}.module.css`,
      content: this.generateCSSModule(component),
      type: 'css'
    });

    // Generate types if needed
    if (this.hasComplexProps(component)) {
      files.push({
        name: `${component.name}.types.ts`,
        content: this.generateTypes(component),
        type: 'types'
      });
    }

    return files;
  }

  private generateTSXComponent(component: FramerComponent): string {
    const componentName = this.sanitizeComponentName(component.name);
    const hasChildren = component.children && component.children.length > 0;
    
    let imports = `import React from 'react';\nimport styles from './${componentName}.module.css';\n`;
    
    if (this.hasComplexProps(component)) {
      imports += `import { ${componentName}Props } from './${componentName}.types';\n`;
    }

    const propsInterface = this.hasComplexProps(component) 
      ? `${componentName}Props` 
      : '{ className?: string }';

    let componentBody = '';
    
    if (hasChildren) {
      componentBody = this.generateChildrenJSX(component.children!);
    } else {
      componentBody = this.generateSingleElementJSX(component);
    }

    return `${imports}
interface Props extends ${propsInterface} {}

const ${componentName}: React.FC<Props> = ({ className = '', ...props }) => {
  return (
    <div className={\`\${styles.container} \${className}\`} {...props}>
      ${componentBody}
    </div>
  );
};

export default ${componentName};`;
  }

  private generateChildrenJSX(children: FramerComponent[]): string {
    return children.map(child => {
      const elementType = this.getElementType(child.type);
      const className = `styles.${this.camelCase(child.name)}`;
      
      if (child.type === 'Text') {
        return `      <${elementType} className={${className}}>
        ${this.getTextContent(child)}
      </${elementType}>`;
      } else if (child.type === 'Button') {
        return `      <${elementType} className={${className}}>
        ${this.getTextContent(child)}
      </${elementType}>`;
      } else {
        return `      <${elementType} className={${className}} />`;
      }
    }).join('\n');
  }

  private generateSingleElementJSX(component: FramerComponent): string {
    const elementType = this.getElementType(component.type);
    
    if (component.type === 'Text') {
      return `${this.getTextContent(component)}`;
    }
    
    return `<${elementType} />`;
  }

  private generateCSSModule(component: FramerComponent): string {
    let css = `.container {\n${this.stylesToCSS(component.styles)}\n}\n`;
    
    if (component.children) {
      component.children.forEach(child => {
        const className = this.camelCase(child.name);
        css += `\n.${className} {\n${this.stylesToCSS(child.styles)}\n}\n`;
      });
    }

    return css;
  }

  private stylesToCSS(styles: ComponentStyles): string {
    const cssProperties: string[] = [];
    
    Object.entries(styles).forEach(([key, value]) => {
      const cssProperty = this.camelToKebab(key);
      const cssValue = this.formatCSSValue(key, value);
      if (cssValue) {
        cssProperties.push(`  ${cssProperty}: ${cssValue};`);
      }
    });

    return cssProperties.join('\n');
  }

  private formatCSSValue(property: string, value: any): string {
    if (typeof value === 'number') {
      // Properties that should have px units
      if (['fontSize', 'borderRadius', 'width', 'height'].includes(property)) {
        return `${value}px`;
      }
      return value.toString();
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    return '';
  }

  private generateTypes(component: FramerComponent): string {
    const componentName = this.sanitizeComponentName(component.name);
    
    return `export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}`;
  }

  private hasComplexProps(component: FramerComponent): boolean {
    // Determine if component needs complex props interface
    return component.type === 'Button' || component.children?.some(child => child.type === 'Button') || false;
  }

  private sanitizeComponentName(name: string): string {
    // Convert to PascalCase and remove invalid characters
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[a-z]/, (match) => match.toUpperCase())
      .replace(/[a-z][A-Z]/g, (match) => match[0] + match[1].toUpperCase());
  }

  private camelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  private getElementType(type: string): string {
    switch (type) {
      case 'Text': return 'p';
      case 'Button': return 'button';
      case 'Image': return 'img';
      default: return 'div';
    }
  }

  private getTextContent(component: FramerComponent): string {
    // In a real implementation, this would extract text from the component data
    switch (component.name.toLowerCase()) {
      case 'herotitle': return 'Welcome to your design';
      case 'herosubtitle': return 'This component was automatically generated from your Framer design';
      case 'ctabutton': return 'Get Started';
      default: return 'Content';
    }
  }
}
