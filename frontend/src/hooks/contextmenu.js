// Add this hook in a separate file or at the top of your component
import {useEffect} from 'react';
/**
 * Hook that handles clicks outside of the specified element
 * @param {React.RefObject} ref - Reference to the element to monitor
 * @param {Function} callback - Function to call when a click outside occurs
 */

const useClickOutside = (ref, callback) => {
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          callback();
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref, callback]);
  };

  export default useClickOutside;