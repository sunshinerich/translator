export { };

declare global {
    interface Window {
        electronAPI: {
            translate: (text: string, source: string, target: string) => Promise<{ success: boolean; text?: string; error?: string }>;
            setAlwaysOnTop: (flag: boolean) => Promise<void>;
            readClipboard: () => Promise<string>;
            getSettings: () => Promise<any>;
            saveSettings: (settings: any) => Promise<void>;
            on: (channel: string, callback: (...args: any[]) => void) => void;
            minimize: () => Promise<void>;
            close: () => Promise<void>;
            showContextMenu: (text: string) => Promise<void>;
            resizeWindow: (x: number, y: number) => Promise<void>;
            moveWindow: (dx: number, dy: number) => Promise<void>;
        };
    }
}
