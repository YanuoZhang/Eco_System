declare module "dom-to-image-more" {
  export interface Options {
    width?: number;
    height?: number;
    style?: Record<string, string>;
    bgcolor?: string;
    quality?: number;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    filter?: (node: Node) => boolean;
  }

  const domtoimage: {
    toBlob: (node: HTMLElement, options?: Options) => Promise<Blob>;
    toPng: (node: HTMLElement, options?: Options) => Promise<string>;
    toJpeg: (node: HTMLElement, options?: Options) => Promise<string>;
    toSvg: (node: HTMLElement, options?: Options) => Promise<string>;
    toPixelData: (node: HTMLElement, options?: Options) => Promise<Uint8ClampedArray>;
  };

  export default domtoimage;
}
