import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const VideoFunc = () => {
    const handleKeydown = (event) => {
        // Disable F12 (Developer Tools)
        if (event.key === 'F12') {
            event.preventDefault();
            toast.error('F12 is not allowed.');
        }

        // Disable Ctrl+Shift+I (Developer Tools)
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') {
            event.preventDefault();
            toast.error('Ctrl+Shift+I is not allowed.');
        }

        // Disable Ctrl+C (Copy)
        if (event.ctrlKey && event.key.toLowerCase() === 'c') {
            event.preventDefault();
            toast.error('Copying is not allowed.');
        }

        // Disable Ctrl+S (Save)
        if (event.ctrlKey && event.key.toLowerCase() === 's') {
            event.preventDefault();
            toast.error('Saving is not allowed.');
        }
    };

    document.addEventListener('copy', (event) => event.preventDefault());
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('cut', (event) => event.preventDefault());
    document.addEventListener('paste', (event) => event.preventDefault());
    document.addEventListener('selectstart', (event) => event.preventDefault());
    document.addEventListener('keydown', handleKeydown);

    return () => {
        document.removeEventListener('copy', (event) => event.preventDefault());
        document.removeEventListener('contextmenu', (event) => event.preventDefault());
        document.removeEventListener('cut', (event) => event.preventDefault());
        document.removeEventListener('paste', (event) => event.preventDefault());
        document.removeEventListener('selectstart', (event) => event.preventDefault());
        document.removeEventListener('keydown', handleKeydown);
    };
};