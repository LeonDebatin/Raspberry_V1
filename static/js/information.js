class InformationController {
    constructor() {
        this.initializeInformation();
        this.setupInteractions();
    }

    initializeInformation() {
        // Initialize any dynamic content or animations for the information section
        this.animateCards();
    }

    setupInteractions() {
        // Add subtle interactions to the scent cards
        const scentCards = document.querySelectorAll('.scent-card');
        
        scentCards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                this.highlightCard(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetCardHighlight(card);
            });
        });
    }

    animateCards() {
        // Animate cards on page load
        const cards = document.querySelectorAll('.scent-card, .control-info');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    highlightCard(card) {
        // Subtle highlight effect on hover
        const cardClass = Array.from(card.classList).find(cls => 
            ['amber', 'sage', 'azure', 'crimson'].includes(cls)
        );
        
        if (cardClass) {
            card.style.transform = 'translateY(-5px) scale(1.02)';
            card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
        }
    }

    resetCardHighlight(card) {
        // Reset highlight effect
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    }

    // Method to update information content dynamically if needed
    updateScentInfo(scentType, title, description) {
        const card = document.querySelector(`.scent-card.${scentType}`);
        if (card) {
            const titleElement = card.querySelector('h3');
            const descriptionElement = card.querySelector('p');
            
            if (titleElement) titleElement.textContent = title;
            if (descriptionElement) descriptionElement.textContent = description;
        }
    }

    // Method to update control instructions
    updateControlInstructions(instructions) {
        const instructionItems = document.querySelectorAll('.instruction-item p');
        
        instructions.forEach((instruction, index) => {
            if (instructionItems[index]) {
                instructionItems[index].textContent = instruction;
            }
        });
    }
}

// Initialize the information controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.information-section')) {
        new InformationController();
    }
});