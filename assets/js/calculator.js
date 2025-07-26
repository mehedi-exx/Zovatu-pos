// Zovatu Billing Tool - Calculator Utility
// Provides calculator functionality for invoice and other pages

class Calculator {
    constructor() {
        this.display = '';
        this.previousValue = '';
        this.operator = '';
        this.waitingForOperand = false;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.createCalculatorHTML();
        this.setupEventListeners();
    }

    createCalculatorHTML() {
        const calculatorHTML = `
            <div id="calculatorModal" class="calculator-modal" style="display: none;">
                <div class="calculator-container">
                    <div class="calculator-header">
                        <h3>Calculator</h3>
                        <button class="calculator-close" onclick="calculator.close()">&times;</button>
                    </div>
                    <div class="calculator-body">
                        <div class="calculator-display">
                            <input type="text" id="calculatorDisplay" readonly value="0">
                        </div>
                        <div class="calculator-buttons">
                            <button class="calc-btn calc-btn-clear" onclick="calculator.clear()">C</button>
                            <button class="calc-btn calc-btn-clear" onclick="calculator.clearEntry()">CE</button>
                            <button class="calc-btn calc-btn-operator" onclick="calculator.inputOperator('/')">/</button>
                            <button class="calc-btn calc-btn-operator" onclick="calculator.inputOperator('*')">×</button>
                            
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('7')">7</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('8')">8</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('9')">9</button>
                            <button class="calc-btn calc-btn-operator" onclick="calculator.inputOperator('-')">-</button>
                            
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('4')">4</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('5')">5</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('6')">6</button>
                            <button class="calc-btn calc-btn-operator" onclick="calculator.inputOperator('+')">+</button>
                            
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('1')">1</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('2')">2</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputNumber('3')">3</button>
                            <button class="calc-btn calc-btn-equals" onclick="calculator.calculate()" rowspan="2">=</button>
                            
                            <button class="calc-btn calc-btn-number calc-btn-zero" onclick="calculator.inputNumber('0')">0</button>
                            <button class="calc-btn calc-btn-number" onclick="calculator.inputDecimal()">.</button>
                        </div>
                        <div class="calculator-actions">
                            <button class="btn btn-primary" onclick="calculator.useResult()">Use Result</button>
                            <button class="btn btn-secondary" onclick="calculator.close()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add calculator CSS
        const calculatorCSS = `
            <style>
                .calculator-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }

                .calculator-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    width: 320px;
                    max-width: 90vw;
                }

                .calculator-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .calculator-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .calculator-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .calculator-close:hover {
                    color: #374151;
                }

                .calculator-body {
                    padding: 20px;
                }

                .calculator-display {
                    margin-bottom: 16px;
                }

                .calculator-display input {
                    width: 100%;
                    padding: 12px 16px;
                    font-size: 24px;
                    font-weight: 600;
                    text-align: right;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background-color: #f9fafb;
                    color: #1f2937;
                }

                .calculator-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .calc-btn {
                    padding: 16px;
                    font-size: 18px;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-height: 56px;
                }

                .calc-btn-number {
                    background-color: #f3f4f6;
                    color: #1f2937;
                }

                .calc-btn-number:hover {
                    background-color: #e5e7eb;
                }

                .calc-btn-operator {
                    background-color: #3b82f6;
                    color: white;
                }

                .calc-btn-operator:hover {
                    background-color: #2563eb;
                }

                .calc-btn-equals {
                    background-color: #10b981;
                    color: white;
                    grid-row: span 2;
                }

                .calc-btn-equals:hover {
                    background-color: #059669;
                }

                .calc-btn-clear {
                    background-color: #ef4444;
                    color: white;
                }

                .calc-btn-clear:hover {
                    background-color: #dc2626;
                }

                .calc-btn-zero {
                    grid-column: span 2;
                }

                .calculator-actions {
                    display: flex;
                    gap: 8px;
                }

                .calculator-actions .btn {
                    flex: 1;
                    padding: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .calculator-actions .btn-primary {
                    background-color: #3b82f6;
                    color: white;
                }

                .calculator-actions .btn-primary:hover {
                    background-color: #2563eb;
                }

                .calculator-actions .btn-secondary {
                    background-color: #6b7280;
                    color: white;
                }

                .calculator-actions .btn-secondary:hover {
                    background-color: #4b5563;
                }

                @media (max-width: 640px) {
                    .calculator-container {
                        width: 300px;
                    }
                    
                    .calc-btn {
                        padding: 12px;
                        font-size: 16px;
                        min-height: 48px;
                    }
                }
            </style>
        `;

        // Add to document
        if (!document.getElementById('calculatorModal')) {
            document.head.insertAdjacentHTML('beforeend', calculatorCSS);
            document.body.insertAdjacentHTML('beforeend', calculatorHTML);
        }
    }

    setupEventListeners() {
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            e.preventDefault();
            
            if (e.key >= '0' && e.key <= '9') {
                this.inputNumber(e.key);
            } else if (e.key === '.') {
                this.inputDecimal();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                this.inputOperator(e.key === '*' ? '*' : e.key);
            } else if (e.key === 'Enter' || e.key === '=') {
                this.calculate();
            } else if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'Backspace') {
                this.backspace();
            } else if (e.key.toLowerCase() === 'c') {
                this.clear();
            }
        });

        // Click outside to close
        document.getElementById('calculatorModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'calculatorModal') {
                this.close();
            }
        });
    }

    open(targetInput = null) {
        this.targetInput = targetInput;
        this.isOpen = true;
        document.getElementById('calculatorModal').style.display = 'flex';
        this.updateDisplay();
    }

    close() {
        this.isOpen = false;
        document.getElementById('calculatorModal').style.display = 'none';
        this.targetInput = null;
    }

    inputNumber(number) {
        if (this.waitingForOperand) {
            this.display = number;
            this.waitingForOperand = false;
        } else {
            this.display = this.display === '0' ? number : this.display + number;
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.waitingForOperand) {
            this.display = '0.';
            this.waitingForOperand = false;
        } else if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
        this.updateDisplay();
    }

    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.display);

        if (this.previousValue === '') {
            this.previousValue = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousValue || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);

            this.display = String(newValue);
            this.previousValue = newValue;
            this.updateDisplay();
        }

        this.waitingForOperand = true;
        this.operator = nextOperator;
    }

    calculate() {
        const inputValue = parseFloat(this.display);

        if (this.previousValue !== '' && this.operator) {
            const currentValue = this.previousValue || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);

            this.display = String(newValue);
            this.previousValue = '';
            this.operator = '';
            this.waitingForOperand = true;
            this.updateDisplay();
        }
    }

    performCalculation(firstValue, secondValue, operator) {
        switch (operator) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '*':
                return firstValue * secondValue;
            case '/':
                return secondValue !== 0 ? firstValue / secondValue : 0;
            default:
                return secondValue;
        }
    }

    clear() {
        this.display = '0';
        this.previousValue = '';
        this.operator = '';
        this.waitingForOperand = false;
        this.updateDisplay();
    }

    clearEntry() {
        this.display = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.display.length > 1) {
            this.display = this.display.slice(0, -1);
        } else {
            this.display = '0';
        }
        this.updateDisplay();
    }

    updateDisplay() {
        const displayElement = document.getElementById('calculatorDisplay');
        if (displayElement) {
            // Format number for display
            const value = parseFloat(this.display);
            if (!isNaN(value)) {
                displayElement.value = this.formatNumber(value);
            } else {
                displayElement.value = this.display;
            }
        }
    }

    formatNumber(number) {
        // Format number with appropriate decimal places
        if (number % 1 === 0) {
            return number.toString();
        } else {
            return number.toFixed(2).replace(/\.?0+$/, '');
        }
    }

    useResult() {
        if (this.targetInput) {
            const value = parseFloat(this.display);
            if (!isNaN(value)) {
                this.targetInput.value = this.formatNumber(value);
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                this.targetInput.dispatchEvent(event);
                
                // Trigger input event for real-time calculations
                const inputEvent = new Event('input', { bubbles: true });
                this.targetInput.dispatchEvent(inputEvent);
            }
        }
        this.close();
    }

    // Static method to add calculator button to input fields
    static addCalculatorButton(inputElement, buttonClass = 'calc-trigger-btn') {
        if (inputElement.nextElementSibling?.classList.contains(buttonClass)) {
            return; // Button already exists
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `${buttonClass} absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`;
        button.innerHTML = '<i class="fas fa-calculator"></i>';
        button.title = 'Open Calculator';
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.calculator.open(inputElement);
        });

        // Make parent relative if not already
        const parent = inputElement.parentElement;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        parent.appendChild(button);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new Calculator();
});

// Export for use in other modules
window.Calculator = Calculator;

