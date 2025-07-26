// Zovatu Billing Tool - Number to Words Converter
// Converts numbers to words in multiple languages (English, Bengali)

class NumberToWords {
    constructor() {
        this.init();
    }

    init() {
        // English number words
        this.englishOnes = [
            '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
            'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
            'seventeen', 'eighteen', 'nineteen'
        ];

        this.englishTens = [
            '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
        ];

        this.englishScales = [
            '', 'thousand', 'million', 'billion', 'trillion'
        ];

        // Bengali number words
        this.bengaliOnes = [
            '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
            'দশ', 'এগার', 'বার', 'তের', 'চৌদ্দ', 'পনের', 'ষোল',
            'সতের', 'আঠার', 'উনিশ'
        ];

        this.bengaliTens = [
            '', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'
        ];

        this.bengaliScales = [
            '', 'হাজার', 'লক্ষ', 'কোটি'
        ];
    }

    // Convert number to English words
    convertToEnglish(number, currency = 'Dollar') {
        if (number === 0) return `Zero ${currency}s`;
        
        const parts = number.toString().split('.');
        const wholePart = parseInt(parts[0]);
        const decimalPart = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2)) : 0;

        let result = this.convertWholeNumberToEnglish(wholePart);
        
        if (wholePart === 1) {
            result += ` ${currency}`;
        } else {
            result += ` ${currency}s`;
        }

        if (decimalPart > 0) {
            const centWord = currency === 'Dollar' ? 'Cent' : 'Paisa';
            const decimalWords = this.convertWholeNumberToEnglish(decimalPart);
            
            if (decimalPart === 1) {
                result += ` and ${decimalWords} ${centWord}`;
            } else {
                result += ` and ${decimalWords} ${centWord}s`;
            }
        }

        return this.capitalizeFirstLetter(result) + ' Only';
    }

    // Convert number to Bengali words
    convertToBengali(number, currency = 'টাকা') {
        if (number === 0) return `শূন্য ${currency}`;
        
        const parts = number.toString().split('.');
        const wholePart = parseInt(parts[0]);
        const decimalPart = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2)) : 0;

        let result = this.convertWholeNumberToBengali(wholePart);
        result += ` ${currency}`;

        if (decimalPart > 0) {
            const centWord = currency === 'টাকা' ? 'পয়সা' : 'পয়সা';
            const decimalWords = this.convertWholeNumberToBengali(decimalPart);
            result += ` ${decimalWords} ${centWord}`;
        }

        return result + ' মাত্র';
    }

    convertWholeNumberToEnglish(number) {
        if (number === 0) return '';
        if (number < 20) return this.englishOnes[number];
        if (number < 100) {
            return this.englishTens[Math.floor(number / 10)] + 
                   (number % 10 !== 0 ? ' ' + this.englishOnes[number % 10] : '');
        }
        if (number < 1000) {
            return this.englishOnes[Math.floor(number / 100)] + ' hundred' +
                   (number % 100 !== 0 ? ' ' + this.convertWholeNumberToEnglish(number % 100) : '');
        }

        // Handle larger numbers
        let result = '';
        let scaleIndex = 0;
        
        while (number > 0) {
            const chunk = number % 1000;
            if (chunk !== 0) {
                const chunkWords = this.convertWholeNumberToEnglish(chunk);
                const scale = this.englishScales[scaleIndex];
                result = chunkWords + (scale ? ' ' + scale : '') + 
                        (result ? ' ' + result : '');
            }
            number = Math.floor(number / 1000);
            scaleIndex++;
        }

        return result;
    }

    convertWholeNumberToBengali(number) {
        if (number === 0) return '';
        if (number < 20) return this.bengaliOnes[number];
        if (number < 100) {
            return this.bengaliTens[Math.floor(number / 10)] + 
                   (number % 10 !== 0 ? ' ' + this.bengaliOnes[number % 10] : '');
        }
        if (number < 1000) {
            return this.bengaliOnes[Math.floor(number / 100)] + ' শত' +
                   (number % 100 !== 0 ? ' ' + this.convertWholeNumberToBengali(number % 100) : '');
        }

        // Handle larger numbers using Bengali number system
        let result = '';
        
        // Crores (10,000,000)
        if (number >= 10000000) {
            const crores = Math.floor(number / 10000000);
            result += this.convertWholeNumberToBengali(crores) + ' কোটি';
            number %= 10000000;
            if (number > 0) result += ' ';
        }

        // Lakhs (100,000)
        if (number >= 100000) {
            const lakhs = Math.floor(number / 100000);
            result += this.convertWholeNumberToBengali(lakhs) + ' লক্ষ';
            number %= 100000;
            if (number > 0) result += ' ';
        }

        // Thousands
        if (number >= 1000) {
            const thousands = Math.floor(number / 1000);
            result += this.convertWholeNumberToBengali(thousands) + ' হাজার';
            number %= 1000;
            if (number > 0) result += ' ';
        }

        // Remaining hundreds, tens, and ones
        if (number > 0) {
            result += this.convertWholeNumberToBengali(number);
        }

        return result.trim();
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Convert amount with currency
    convertAmount(amount, currency = 'USD', language = 'en') {
        const number = parseFloat(amount);
        if (isNaN(number)) return 'Invalid number';

        if (language === 'bn' || language === 'bengali') {
            const currencyName = this.getCurrencyNameBengali(currency);
            return this.convertToBengali(number, currencyName);
        } else {
            const currencyName = this.getCurrencyNameEnglish(currency);
            return this.convertToEnglish(number, currencyName);
        }
    }

    getCurrencyNameEnglish(currency) {
        const currencies = {
            'USD': 'Dollar',
            'EUR': 'Euro',
            'GBP': 'Pound',
            'BDT': 'Taka',
            'INR': 'Rupee',
            'JPY': 'Yen'
        };
        return currencies[currency] || 'Dollar';
    }

    getCurrencyNameBengali(currency) {
        const currencies = {
            'USD': 'ডলার',
            'EUR': 'ইউরো',
            'GBP': 'পাউন্ড',
            'BDT': 'টাকা',
            'INR': 'রুপি',
            'JPY': 'ইয়েন'
        };
        return currencies[currency] || 'টাকা';
    }

    // Create number to words widget
    createWidget() {
        const widgetHTML = `
            <div id="numberToWordsModal" class="modal" style="display: none;">
                <div class="modal-content max-w-md">
                    <div class="modal-header">
                        <h3 class="modal-title">Number to Words Converter</h3>
                        <button class="modal-close" onclick="numberToWords.closeWidget()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Enter Amount</label>
                            <input type="number" id="numberInput" class="form-input" placeholder="Enter number" step="0.01">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="form-group">
                                <label class="form-label">Currency</label>
                                <select id="currencySelect" class="form-select">
                                    <option value="USD">USD - Dollar</option>
                                    <option value="BDT">BDT - Taka</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - Pound</option>
                                    <option value="INR">INR - Rupee</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Language</label>
                                <select id="languageSelect" class="form-select">
                                    <option value="en">English</option>
                                    <option value="bn">Bengali</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Result</label>
                            <textarea id="wordsResult" class="form-input" rows="4" readonly placeholder="Words will appear here..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="numberToWords.closeWidget()">Close</button>
                        <button type="button" class="btn btn-primary" onclick="numberToWords.copyResult()">Copy Result</button>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('numberToWordsModal')) {
            document.body.insertAdjacentHTML('beforeend', widgetHTML);
            this.setupWidgetEventListeners();
        }
    }

    setupWidgetEventListeners() {
        const numberInput = document.getElementById('numberInput');
        const currencySelect = document.getElementById('currencySelect');
        const languageSelect = document.getElementById('languageSelect');

        const updateResult = () => {
            const amount = numberInput.value;
            const currency = currencySelect.value;
            const language = languageSelect.value;

            if (amount && !isNaN(amount)) {
                const result = this.convertAmount(amount, currency, language);
                document.getElementById('wordsResult').value = result;
            } else {
                document.getElementById('wordsResult').value = '';
            }
        };

        numberInput?.addEventListener('input', updateResult);
        currencySelect?.addEventListener('change', updateResult);
        languageSelect?.addEventListener('change', updateResult);

        // Click outside to close
        document.getElementById('numberToWordsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'numberToWordsModal') {
                this.closeWidget();
            }
        });
    }

    openWidget(initialValue = '') {
        this.createWidget();
        document.getElementById('numberToWordsModal').style.display = 'flex';
        
        if (initialValue) {
            document.getElementById('numberInput').value = initialValue;
            // Trigger update
            const event = new Event('input');
            document.getElementById('numberInput').dispatchEvent(event);
        }
        
        setTimeout(() => {
            document.getElementById('numberInput').focus();
        }, 100);
    }

    closeWidget() {
        document.getElementById('numberToWordsModal').style.display = 'none';
    }

    copyResult() {
        const result = document.getElementById('wordsResult').value;
        if (result) {
            navigator.clipboard.writeText(result).then(() => {
                ZovatuApp.showNotification('Result copied to clipboard', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.getElementById('wordsResult');
                textarea.select();
                document.execCommand('copy');
                ZovatuApp.showNotification('Result copied to clipboard', 'success');
            });
        }
    }

    // Static method to add number to words button to input fields
    static addConverterButton(inputElement, buttonClass = 'words-trigger-btn') {
        if (inputElement.nextElementSibling?.classList.contains(buttonClass)) {
            return; // Button already exists
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `${buttonClass} absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`;
        button.innerHTML = '<i class="fas fa-spell-check"></i>';
        button.title = 'Convert to Words';
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.numberToWords.openWidget(inputElement.value);
        });

        // Make parent relative if not already
        const parent = inputElement.parentElement;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        parent.appendChild(button);
    }
}

// Initialize number to words converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.numberToWords = new NumberToWords();
});

// Export for use in other modules
window.NumberToWords = NumberToWords;

