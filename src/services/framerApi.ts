
export interface FramerDesignData {
  id: string;
  name: string;
  components: FramerComponent[];
  designTokens: DesignTokens;
  assets: Asset[];
}

export interface FramerComponent {
  id: string;
  name: string;
  type: 'Frame' | 'Text' | 'Image' | 'Button' | 'Component';
  properties: ComponentProperties;
  children?: FramerComponent[];
  styles: ComponentStyles;
}

export interface ComponentProperties {
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
  visible?: boolean;
  opacity?: number;
  rotation?: number;
}

export interface ComponentStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  borderRadius?: number;
  padding?: string;
  margin?: string;
  border?: string;
  boxShadow?: string;
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
}

export interface TypographyToken {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  fontFamily: string;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'font';
  width?: number;
  height?: number;
}

export class FramerApiClient {
  private readonly baseUrl = 'https://api.framer.com/v1';
  
  async fetchDesignData(hash: string): Promise<FramerDesignData> {
    console.log(`Fetching design data for hash: ${hash}`);
    
    try {
      // For now, simulate API call with realistic data structure
      // In production, this would make actual API calls
      const mockData: FramerDesignData = {
        id: hash,
        name: `Design-${hash.substring(0, 8)}`,
        components: [
          {
            id: 'hero-section',
            name: 'HeroSection',
            type: 'Frame',
            properties: {
              width: '100%',
              height: '400px'
            },
            styles: {
              backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '4rem 2rem',
              color: 'white'
            },
            children: [
              {
                id: 'hero-title',
                name: 'HeroTitle',
                type: 'Text',
                properties: {},
                styles: {
                  fontSize: 48,
                  fontWeight: 700,
                  color: 'white',
                  fontFamily: 'Inter'
                }
              },
              {
                id: 'hero-subtitle',
                name: 'HeroSubtitle',
                type: 'Text',
                properties: {},
                styles: {
                  fontSize: 18,
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: 'Inter'
                }
              },
              {
                id: 'cta-button',
                name: 'CTAButton',
                type: 'Button',
                properties: {},
                styles: {
                  backgroundColor: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: 25,
                  fontSize: 16,
                  fontWeight: 600
                }
              }
            ]
          }
        ],
        designTokens: {
          colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#ff6b6b',
            text: '#ffffff'
          },
          typography: {
            heading: {
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: 'Inter'
            },
            body: {
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.6,
              fontFamily: 'Inter'
            }
          },
          spacing: {
            xs: 8,
            sm: 16,
            md: 24,
            lg: 32,
            xl: 48
          },
          borderRadius: {
            sm: 4,
            md: 8,
            lg: 16,
            xl: 24
          }
        },
        assets: []
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching design data:', error);
      throw new Error(`Failed to fetch design data: ${error}`);
    }
  }

  async validateHash(hash: string): Promise<boolean> {
    // Validate hash format (16 character hex string)
    const hashRegex = /^[a-fA-F0-9]{16}$/;
    return hashRegex.test(hash);
  }
}
