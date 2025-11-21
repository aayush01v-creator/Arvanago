
import { useState, useEffect, useCallback } from 'react';

export const useTypingEffect = (phrases: string[], interPhraseDelay: number = 2000, typingSpeed: number = 100, deletingSpeed: number = 50) => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const currentPhrase = phrases[phraseIndex];
    
    const handleTyping = useCallback(() => {
        if (isDeleting) {
            if (typedText === '') {
                setIsDeleting(false);
                setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
            } else {
                setTypedText((prev) => prev.slice(0, -1));
            }
        } else {
            if (typedText === currentPhrase) {
                // Wait before starting to delete
                const timer = setTimeout(() => setIsDeleting(true), interPhraseDelay);
                return () => clearTimeout(timer);
            } else {
                setTypedText((prev) => currentPhrase.substring(0, prev.length + 1));
            }
        }
    }, [isDeleting, typedText, currentPhrase, phrases.length, interPhraseDelay]);

    useEffect(() => {
        // Make typing speed variable for a more natural effect
        const speed = isDeleting ? deletingSpeed : typingSpeed - 50 + (Math.random() * 100);
        const timer = setTimeout(handleTyping, speed);

        return () => clearTimeout(timer);
    }, [typedText, handleTyping, isDeleting, deletingSpeed, typingSpeed]);

    return typedText;
};