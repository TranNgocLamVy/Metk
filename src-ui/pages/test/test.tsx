import { Drawing } from './drawing';
import { TextureUtils } from '@/appcore/utils/texture-utils';
import { useApplication } from '@pixi/react';
import { useEffect, useRef } from 'react';


export default function Test() {
    const drawingRef = useRef<Drawing | null>(null);
    const { app, isInitialised } = useApplication()

    useEffect(() => {
        if (isInitialised) {
            drawingRef.current = new Drawing(app);
        }

        return () => {
            if (drawingRef.current) {
                drawingRef.current.destroy(); 
                drawingRef.current = null;
            }
        }
    }, [isInitialised])
    return null;
}

