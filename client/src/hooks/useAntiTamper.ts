import { useEffect, RefObject } from 'react';
import { toast } from 'sonner';

/**
 * A hook that monitors a DOM element for tampering (changes to text content or attributes)
 * and punishes the user if detected.
 */
export function useAntiTamper(
    ref: RefObject<HTMLElement | null>,
    value: string | number | null,
    active: boolean = true
) {
    useEffect(() => {
        if (!active || !ref.current || value === null) return;

        const element = ref.current;

        // Configuration for the observer
        const config = {
            characterData: true,
            childList: true,
            subtree: true,
            attributes: true
        };

        // Callback function to execute when mutations are observed
        const callback = (mutationsList: MutationRecord[]) => {
            for (const mutation of mutationsList) {
                // If text content changed and it doesn't match the React state
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const currentText = element.innerText;
                    if (currentText !== String(value)) {
                        console.warn('Tampering detected!');
                        toast.error("DON'T TOUCH THE CONSOLE! 🚫", {
                            duration: 5000,
                            style: {
                                background: 'red',
                                color: 'white',
                                fontSize: '20px'
                            }
                        });

                        // Force reload or just reset text (React usually handles reset on re-render, 
                        // but aggressive tampering might need aggressive response)
                        element.innerText = String(value);

                        // fun punishment: reload page
                        // window.location.reload(); 
                    }
                }
            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(element, config);

        // Stop observing on cleanup
        return () => observer.disconnect();
    }, [ref, value, active]);
}
