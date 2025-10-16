// @ts-ignore: module 'date-convert-ad-bs' has no type declarations
import { ADTOBS } from 'date-convert-ad-bs';

// Nepali month names
const nepaliMonths = [
    'Baishakh',     // 1
    'Jestha',       // 2
    'Ashadh',       // 3
    'Shrawan',      // 4
    'Bhadra',       // 5
    'Ashwin',       // 6
    'Kartik',       // 7
    'Mangsir',      // 8
    'Poush',        // 9
    'Magh',         // 10
    'Falgun',       // 11
    'Chaitra'       // 12
];

/**
 * Converts AD (Gregorian) date to BS (Bikram Sambat) format
 * @param dateString - Date string in format "YYYY-MM-DD" or "YYYY/MM/DD"
 * @returns Formatted BS date like "2081 Baisakh 12 B.S." or null if invalid
 */
export function convertToBS(dateString: string | null | undefined): string | null {
    if (!dateString) return null;    
    try {
        // Handle different date formats
        let year: number, month: number, day: number;
        
        if (dateString.includes('-')) {
            [year, month, day] = dateString.split('-').map(Number);
        } else if (dateString.includes('/')) {
            [year, month, day] = dateString.split('/').map(Number);
        } else {
            return null;
        }
        
        // Validate the parsed values
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            console.error('Invalid date components:', { year, month, day });
            return null;
        }
                
        // Convert AD to BS using the library
        const bsDate = ADTOBS(year, month, day);
                
        if (!bsDate) {
            console.error('No BS date result');
            return null;
        }
        
        let bsYear: number, bsMonth: number, bsDay: number;
        
        // Handle if result is a string (like "2082-07-26")
        if (typeof bsDate === 'string') {
            
            if (bsDate.includes('-')) {
                [bsYear, bsMonth, bsDay] = bsDate.split('-').map(Number);
            } else {
                console.error('Invalid BS date string format:', bsDate);
                return null;
            }
        } 
        // Handle if result is an object
        else if (typeof bsDate === 'object') {            
            // Extract BS year, month, and day - try different property names
            bsYear = bsDate.year || bsDate.bsYear || bsDate.Y;
            bsMonth = bsDate.month || bsDate.bsMonth || bsDate.M;
            bsDay = bsDate.day || bsDate.bsDay || bsDate.D;
        } else {
            console.error('Invalid BS date result type:', typeof bsDate, bsDate);
            return null;
        }
                
        // Validate BS date components
        if (!bsYear || !bsMonth || !bsDay || isNaN(bsYear) || isNaN(bsMonth) || isNaN(bsDay)) {
            console.error('Missing or invalid BS date components:', { bsYear, bsMonth, bsDay });
            return null;
        }
        
        // Get month name (months are 1-indexed)
        const monthName = nepaliMonths[bsMonth - 1];
        
        if (!monthName) {
            console.error('Invalid month index:', bsMonth);
            return null;
        }
        
        const result = `${bsYear} ${monthName} ${bsDay} B.S.`;        
        // Format and return the date
        return result;
        
    } catch (error) {
        console.error('Error converting date to BS:', error);
        return null;
    }
}

/**
 * Utility function to get current date in BS format
 * @returns Current date in BS format like "2081 Baisakh 12 B.S."
 */
export function getCurrentBSDate(): string | null {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();
    
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return convertToBS(dateString);
}

/**
 * Utility function to format AD date to readable format
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @returns Formatted AD date like "October 16, 2025"
 */
export function formatADDate(dateString: string | null | undefined): string | null {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting AD date:', error);
        return null;
    }
}