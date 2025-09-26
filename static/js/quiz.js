// Quiz functionality

class QuizController {
    constructor() {
        this.questions = [
            {
                question: "When you wake up in the morning, which describes your ideal mood?",
                options: [
                    { text: "Energized and ready to conquer the day", value: "red" },
                    { text: "Calm and peacefully centered", value: "blue" },
                    { text: "Warm and comfortable, taking it slow", value: "yellow" },
                    { text: "Fresh and mentally alert", value: "green" }
                ]
            },
            {
                question: "What type of environment helps you feel most productive?",
                options: [
                    { text: "A dynamic, high-energy space", value: "red" },
                    { text: "A quiet, serene atmosphere", value: "blue" },
                    { text: "A cozy, welcoming environment", value: "yellow" },
                    { text: "A clean, organized, and airy space", value: "green" }
                ]
            },
            {
                question: "When you're stressed, what helps you most?",
                options: [
                    { text: "Something invigorating to boost my confidence", value: "red" },
                    { text: "Something calming to help me relax", value: "blue" },
                    { text: "Something comforting to make me feel safe", value: "yellow" },
                    { text: "Something refreshing to clear my mind", value: "green" }
                ]
            },
            {
                question: "Which season resonates most with your personality?",
                options: [
                    { text: "Summer - passionate and vibrant", value: "red" },
                    { text: "Winter - peaceful and reflective", value: "blue" },
                    { text: "Autumn - warm and nurturing", value: "yellow" },
                    { text: "Spring - fresh and renewed", value: "green" }
                ]
            },
            {
                question: "What's your ideal way to spend a free evening?",
                options: [
                    { text: "Going out and being active with friends", value: "red" },
                    { text: "Reading a book or meditating quietly", value: "blue" },
                    { text: "Cooking a meal and enjoying it at home", value: "yellow" },
                    { text: "Taking a walk in nature", value: "green" }
                ]
            },
            {
                question: "Which scent memory brings you the most joy?",
                options: [
                    { text: "Spicy, bold fragrances that make a statement", value: "red" },
                    { text: "Ocean breeze or cool mountain air", value: "blue" },
                    { text: "Vanilla, cinnamon, or warm baked goods", value: "yellow" },
                    { text: "Fresh herbs, pine forests, or cut grass", value: "green" }
                ]
            },
            {
                question: "How do you prefer to approach challenges?",
                options: [
                    { text: "Head-on with passion and determination", value: "red" },
                    { text: "Thoughtfully and with careful consideration", value: "blue" },
                    { text: "With patience and steady persistence", value: "yellow" },
                    { text: "With a clear mind and strategic thinking", value: "green" }
                ]
            },
            {
                question: "What kind of music lifts your spirits?",
                options: [
                    { text: "Upbeat, energetic songs that get my blood pumping", value: "red" },
                    { text: "Soft, ambient music that soothes my soul", value: "blue" },
                    { text: "Warm, melodic tunes that feel like a hug", value: "yellow" },
                    { text: "Natural sounds or acoustic melodies", value: "green" }
                ]
            },
            {
                question: "Which color palette appeals to you most?",
                options: [
                    { text: "Bold reds, deep oranges, and passionate purples", value: "red" },
                    { text: "Cool blues, soft grays, and tranquil whites", value: "blue" },
                    { text: "Warm golds, rich browns, and cozy creams", value: "yellow" },
                    { text: "Fresh greens, natural beiges, and earthy tones", value: "green" }
                ]
            },
            {
                question: "What do you want a scent to do for your space?",
                options: [
                    { text: "Make it feel dynamic and inspiring", value: "red" },
                    { text: "Create a peaceful retreat from the world", value: "blue" },
                    { text: "Make it feel like a warm, welcoming home", value: "yellow" },
                    { text: "Bring the freshness of nature indoors", value: "green" }
                ]
            }
        ];
        
        this.currentQuestion = 0;
        this.answers = [];
        this.recommendedScent = null;
        
        this.initializeElements();
        this.bindEvents();
        this.showIntro();
    }
    
    initializeElements() {
        // Sections
        this.introSection = document.getElementById('quiz-intro');
        this.questionsSection = document.getElementById('quiz-questions');
        this.resultsSection = document.getElementById('quiz-results');
        
        // Intro elements
        this.startQuizBtn = document.getElementById('start-quiz-btn');
        
        // Question elements
        this.questionNumber = document.getElementById('question-number');
        this.progressFill = document.getElementById('progress-fill');
        this.questionText = document.getElementById('question-text');
        this.answerOptions = document.getElementById('answer-options');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // Result elements
        this.resultColorDot = document.getElementById('result-color-dot');
        this.resultScentName = document.getElementById('result-scent-name');
        this.resultDescription = document.getElementById('result-description');
        this.resultMood = document.getElementById('result-mood');
        this.scoreChart = document.getElementById('score-chart');
        this.tryScentBtn = document.getElementById('try-scent-btn');
        this.retakeQuizBtn = document.getElementById('retake-quiz-btn');
    }
    
    bindEvents() {
        this.startQuizBtn.addEventListener('click', () => this.startQuiz());
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.tryScentBtn.addEventListener('click', () => this.tryRecommendedScent());
        this.retakeQuizBtn.addEventListener('click', () => this.retakeQuiz());
    }
    
    showIntro() {
        this.hideAllSections();
        this.introSection.classList.add('active');
    }
    
    startQuiz() {
        this.currentQuestion = 0;
        this.answers = [];
        this.hideAllSections();
        this.questionsSection.classList.add('active');
        this.showQuestion();
    }
    
    showQuestion() {
        const question = this.questions[this.currentQuestion];
        
        // Update question number and progress
        this.questionNumber.textContent = this.currentQuestion + 1;
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Update question text
        this.questionText.textContent = question.question;
        
        // Clear and populate answer options
        this.answerOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('button');
            optionElement.className = 'answer-option';
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;
            optionElement.addEventListener('click', () => this.selectAnswer(option.value, optionElement));
            this.answerOptions.appendChild(optionElement);
        });
        
        // Update navigation buttons
        this.prevBtn.disabled = this.currentQuestion === 0;
        this.nextBtn.disabled = !this.answers[this.currentQuestion];
        
        // Restore previous answer if exists
        if (this.answers[this.currentQuestion]) {
            this.highlightSelectedAnswer(this.answers[this.currentQuestion]);
        }
    }
    
    selectAnswer(value, element) {
        // Remove previous selection
        this.answerOptions.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to clicked element
        element.classList.add('selected');
        
        // Store answer
        this.answers[this.currentQuestion] = value;
        
        // Enable next button
        this.nextBtn.disabled = false;
        
        // Auto-advance after a short delay for better UX
        setTimeout(() => {
            if (this.currentQuestion < this.questions.length - 1) {
                this.nextQuestion();
            } else {
                this.finishQuiz();
            }
        }, 500);
    }
    
    highlightSelectedAnswer(value) {
        const selectedOption = this.answerOptions.querySelector(`[data-value="${value}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
    
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.showQuestion();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.showQuestion();
        } else {
            this.finishQuiz();
        }
    }
    
    async finishQuiz() {
        try {
            // Show loading state
            this.nextBtn.disabled = true;
            this.nextBtn.textContent = 'Analyzing...';
            
            // Send answers to backend
            const response = await fetch('/api/quiz-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers: this.answers })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get quiz result');
            }
            
            const result = await response.json();
            this.displayResults(result);
            
        } catch (error) {
            console.error('Error getting quiz result:', error);
            this.showError('Failed to calculate results. Please try again.');
        }
    }
    
    displayResults(result) {
        this.recommendedScent = result.recommended_scent;
        const scentInfo = result.scent_info;
        const scoreBreakdown = result.score_breakdown;
        
        // Update result display
        this.resultColorDot.className = `color-dot large ${this.recommendedScent === 'red' ? 'crimson' : 
                                                          this.recommendedScent === 'blue' ? 'azure' :
                                                          this.recommendedScent === 'yellow' ? 'amber' : 'sage'}`;
        this.resultScentName.textContent = scentInfo.name;
        this.resultDescription.textContent = scentInfo.description;
        this.resultMood.textContent = scentInfo.mood;
        
        // Display score breakdown
        this.displayScoreBreakdown(scoreBreakdown);
        
        // Show results section
        this.hideAllSections();
        this.resultsSection.classList.add('active');
    }
    
    displayScoreBreakdown(scores) {
        const maxScore = Math.max(...Object.values(scores));
        const scentNames = {
            'red': 'CRIMSON',
            'blue': 'AZURE', 
            'yellow': 'AMBER',
            'green': 'SAGE'
        };
        
        this.scoreChart.innerHTML = '';
        
        Object.entries(scores).forEach(([scent, score]) => {
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `
                <div class="score-label">
                    <div class="color-dot ${scent === 'red' ? 'crimson' : 
                                            scent === 'blue' ? 'azure' :
                                            scent === 'yellow' ? 'amber' : 'sage'}"></div>
                    <span>${scentNames[scent]}</span>
                </div>
                <div class="score-bar">
                    <div class="score-fill ${scent === 'red' ? 'crimson' : 
                                             scent === 'blue' ? 'azure' :
                                             scent === 'yellow' ? 'amber' : 'sage'}" 
                         style="width: ${percentage}%"></div>
                </div>
                <div class="score-value">${score}</div>
            `;
            this.scoreChart.appendChild(scoreItem);
        });
    }
    
    async tryRecommendedScent() {
        try {
            // Redirect to selection page and activate the recommended scent
            const response = await fetch('/api/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    color: this.recommendedScent,
                    cycle_time: 60,
                    duration: 10
                })
            });
            
            if (response.ok) {
                // Redirect to selection page
                window.location.href = '/';
            } else {
                throw new Error('Failed to activate scent');
            }
            
        } catch (error) {
            console.error('Error activating scent:', error);
            this.showError('Failed to activate scent. Please try manually from the Selection page.');
        }
    }
    
    retakeQuiz() {
        this.startQuiz();
    }
    
    hideAllSections() {
        this.introSection.classList.remove('active');
        this.questionsSection.classList.remove('active');
        this.resultsSection.classList.remove('active');
    }
    
    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
    }
}

// Initialize quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizController();
});