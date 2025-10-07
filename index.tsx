import { GoogleGenAI } from "@google/genai";

document.addEventListener('DOMContentLoaded', () => {
    // --- Select all DOM elements once ---
    const navContainer = document.getElementById('main-nav');
    const contentContainer = document.getElementById('content-container');

    const lyricsSandbox = document.getElementById('lyrics-sandbox') as HTMLTextAreaElement;
    const stylesSandbox = document.getElementById('styles-sandbox') as HTMLTextAreaElement;
    const stylesSandboxContainer = document.getElementById('styles-sandbox-container');
    
    const copyLyricsBtn = document.getElementById('copy-lyrics-btn');
    const clearLyricsBtn = document.getElementById('clear-lyrics-btn');
    const copyStylesBtn = document.getElementById('copy-styles-btn');
    const clearStylesBtn = document.getElementById('clear-styles-btn');
    
    const copyLyricsFeedback = document.getElementById('copy-lyrics-feedback');
    const copyStylesFeedback = document.getElementById('copy-styles-feedback');
    
    // AI Architect Elements
    const createStructureBtn = document.getElementById('create-structure-btn');
    const aiFeedback = document.getElementById('ai-feedback');
    const finalPromptContainer = document.getElementById('final-prompt-container');
    const finalPromptOutput = document.getElementById('final-prompt-output') as HTMLTextAreaElement;
    const copyFinalBtn = document.getElementById('copy-final-btn');
    const copyFinalFeedback = document.getElementById('copy-final-feedback');
    const generateDoublerFxBtn = document.getElementById('generate-doubler-fx-btn');
    const resetAppBtn = document.getElementById('reset-app-btn');
    
    // Profi-Modus Elements
    const profiModeToggle = document.getElementById('profi-mode-toggle') as HTMLInputElement;
    const profiModeInputs = document.getElementById('profi-mode-inputs');
    const profiGenre = document.getElementById('profi-genre') as HTMLInputElement;
    const profiBpm = document.getElementById('profi-bpm') as HTMLInputElement;
    const profiKey = document.getElementById('profi-key') as HTMLInputElement;
    const profiMood = document.getElementById('profi-mood') as HTMLInputElement;
    const profiInstruments = document.getElementById('profi-instruments') as HTMLTextAreaElement;
    const profiVocalsProd = document.getElementById('profi-vocals-prod') as HTMLTextAreaElement;

    const spinner = createStructureBtn?.querySelector('#spinner');
    const icon = createStructureBtn?.querySelector('.icon');
    const btnText = createStructureBtn?.querySelector('.btn-text');

    // Debugger Elements
    const debuggerContainer = document.getElementById('debugger-container');
    const debuggerTitle = document.getElementById('debugger-title');
    const debuggerOutput = document.getElementById('debugger-output');
    const fixPromptBtn = document.getElementById('fix-prompt-btn');

    if (!navContainer || !contentContainer || !lyricsSandbox || !stylesSandbox || !copyLyricsBtn || !clearLyricsBtn || !copyStylesBtn || !clearStylesBtn || !createStructureBtn || !aiFeedback || !finalPromptContainer || !finalPromptOutput || !copyFinalBtn || !copyFinalFeedback || !spinner || !btnText || !icon || !generateDoublerFxBtn || !resetAppBtn || !stylesSandboxContainer || !profiModeToggle || !profiModeInputs || !profiGenre || !profiBpm || !profiKey || !profiMood || !profiInstruments || !profiVocalsProd || !debuggerContainer || !debuggerTitle || !debuggerOutput || !fixPromptBtn) {
        console.error('One or more essential DOM elements are missing.');
        return;
    }

    const navButtons = navContainer.querySelectorAll('.nav-btn');
    const contentSections = contentContainer.querySelectorAll('.content-section');

    // --- Navigation Logic ---
    function setActiveSection(sectionId: string) {
        navButtons.forEach(btn => {
            if ((btn as HTMLElement).dataset.section) {
                 btn.classList.toggle('active-nav', (btn as HTMLElement).dataset.section === sectionId);
            }
        });
        contentSections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
    }

    navContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const sectionId = target.dataset.section;
        if (target.matches('.nav-btn') && sectionId) {
            setActiveSection(sectionId);
        }
    });

    // --- Global Reset Logic ---
    resetAppBtn.addEventListener('click', () => {
        if (confirm('Möchten Sie wirklich alles zurücksetzen?')) {
            lyricsSandbox.value = '';
            stylesSandbox.value = '';
            
            // Reset profi-modus fields
            profiGenre.value = '';
            profiBpm.value = '';
            profiKey.value = '';
            profiMood.value = '';
            profiInstruments.value = '';
            profiVocalsProd.value = '';
            if (profiModeToggle.checked) {
                profiModeToggle.click(); // This will trigger the change event to hide fields and re-enable the styles sandbox
            }

            if(copyLyricsFeedback) copyLyricsFeedback.textContent = '';
            if(copyStylesFeedback) copyStylesFeedback.textContent = '';
            if(aiFeedback) aiFeedback.textContent = '';
            
            clearAndHideFinalPrompt();
            setActiveSection('lyrics-struktur');
        }
    });

    // --- Intelligent Tag & Template Button Logic ---
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.matches('.tag-btn')) {
            const template = target.dataset.template;
            
            if (template) {
                const decodedTemplate = template.replace(/&#10;/g, '\n');
                const currentValue = lyricsSandbox.value;
                const separator = currentValue.length > 0 && !currentValue.endsWith('\n\n') 
                                  ? (currentValue.endsWith('\n') ? '\n' : '') 
                                  : '';
                lyricsSandbox.value += separator + decodedTemplate;
                lyricsSandbox.focus();
                return;
            }

            const tagText = target.textContent || '';
            let targetSandbox: HTMLTextAreaElement;

            if (profiModeToggle.checked) {
                targetSandbox = lyricsSandbox;
            } else {
                const stylesSectionActive = document.getElementById('styles-section')?.classList.contains('active');
                targetSandbox = stylesSectionActive ? stylesSandbox : lyricsSandbox;
            }

            const start = targetSandbox.selectionStart;
            const end = targetSandbox.selectionEnd;
            const currentText = targetSandbox.value;
            const textBeforeCursor = currentText.substring(0, start);

            let textToInsert = tagText;
            if (textBeforeCursor.length > 0 && !/\s$/.test(textBeforeCursor)) {
                textToInsert = ' ' + textToInsert;
            }
            
            targetSandbox.value = currentText.substring(0, start) + textToInsert + currentText.substring(end);
            targetSandbox.selectionStart = targetSandbox.selectionEnd = start + textToInsert.length;
            targetSandbox.focus();
        }
    });
    
    // --- Helper & UI Functions ---
    const handleCopy = (textarea: HTMLTextAreaElement, feedbackEl: HTMLElement, successMsg: string) => {
        if (!textarea.value) return;
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        try {
            navigator.clipboard.writeText(textarea.value).then(() => {
                feedbackEl.textContent = successMsg;
                setTimeout(() => {
                    feedbackEl.textContent = '';
                }, 2000);
            }, () => {
                 feedbackEl.textContent = 'Kopieren fehlgeschlagen.';
            });
        } catch (err) {
            console.error('Clipboard API copy failed:', err);
            feedbackEl.textContent = 'Kopieren fehlgeschlagen.';
        }
    };

    const hideDebugger = () => {
        debuggerContainer?.classList.add('hidden');
        fixPromptBtn?.classList.add('hidden');
        if(debuggerOutput) debuggerOutput.innerHTML = '';
    }
    
    const clearAndHideFinalPrompt = () => {
        if (!finalPromptContainer.classList.contains('hidden')) {
            finalPromptContainer.classList.add('hidden');
            finalPromptOutput.value = '';
            if (copyFinalFeedback) copyFinalFeedback.textContent = '';
        }
        hideDebugger();
    };

    copyLyricsBtn.addEventListener('click', () => handleCopy(lyricsSandbox, copyLyricsFeedback, 'Kopiert!'));
    copyStylesBtn.addEventListener('click', () => handleCopy(stylesSandbox, copyStylesFeedback, 'Kopiert!'));
    copyFinalBtn.addEventListener('click', () => handleCopy(finalPromptOutput, copyFinalFeedback, 'Finaler Prompt kopiert!'));
    
    clearLyricsBtn.addEventListener('click', () => {
        lyricsSandbox.value = '';
        if(copyLyricsFeedback) copyLyricsFeedback.textContent = '';
        clearAndHideFinalPrompt();
    });
    
    clearStylesBtn.addEventListener('click', () => {
        stylesSandbox.value = '';
        if(copyStylesFeedback) copyStylesFeedback.textContent = '';
        if(aiFeedback) aiFeedback.textContent = '';
        clearAndHideFinalPrompt();
    });

    setActiveSection('lyrics-struktur');

    // --- Profi-Modus Logic ---
    profiModeToggle.addEventListener('change', () => {
        const isEnabled = profiModeToggle.checked;
        profiModeInputs.classList.toggle('hidden', !isEnabled);
        stylesSandboxContainer.classList.toggle('sandbox-disabled', isEnabled);
        stylesSandbox.disabled = isEnabled;
    });

    // --- AI Logic ---
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        aiFeedback.textContent = 'API-Schlüssel nicht gefunden.';
        createStructureBtn.setAttribute('disabled', 'true');
        generateDoublerFxBtn.setAttribute('disabled', 'true');
        return;
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // --- Vocal Doubler & FX Assistant ---
    const generateVocalDoubleAndFx = async () => {
        const cursorPosition = lyricsSandbox.selectionStart;
        const textBeforeCursor = lyricsSandbox.value.substring(0, cursorPosition);
        const lastNewline = textBeforeCursor.lastIndexOf('\n');
        const currentLine = textBeforeCursor.substring(lastNewline + 1).trim();

        if (!currentLine) {
            alert('Bitte platzieren Sie den Cursor nach einer Textzeile.');
            return;
        }
        
        generateDoublerFxBtn.setAttribute('disabled', 'true');
        const btnText = generateDoublerFxBtn.querySelector('.btn-text');
        if(btnText) btnText.textContent = 'Analysiere...';

        try {
            const systemInstruction = `You are a creative 'Vocal FX Engineer' for the Suno AI music platform. Your task is to generate a combined ad-lib and vocal effect layer for a given line of lyrics.

**RULES:**
1.  You will receive a single line of lyrics.
2.  Your output MUST be a single string in the format: \`(ad-lib)(vocal-effect)\`.
3.  **Ad-lib Generation:** Create a short, creative, rhythmic ad-lib based on the input lyric. This could be a repetition of a word, a variation, or a phonetic echo. Examples: For "DISCO ROCKER!", you might generate \`(rocker disco)\` or \`(disco-disco)\`. For "Feeling the heat", you could create \`(the heat)\`.
4.  **Vocal Effect Selection:** Choose a single, appropriate, and interesting vocal effect from the following list: \`(vocal filter echo)\`, \`(vocal filter flanger)\`, \`(tape stop effect)\`, \`(stutter edit)\`, \`(reverse swell)\`, \`(pitch shift down)\`, \`(pitch shift up)\`, \`(robotic vocoder)\`, \`(ethereal reverb)\`.
5.  **Formatting:** The final output MUST be ONLY the two parenthesized parts, with no space in between and no extra text or explanation.
    *   **Correct:** \`(rocker disco)(vocal filter flanger)\`
    *   **Incorrect:** \`Here is your effect: (rocker disco) (vocal filter flanger)\``;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: currentLine,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.9,
                }
            });

            const fxText = " " + response.text.trim();
            const start = lyricsSandbox.selectionStart;
            const end = lyricsSandbox.selectionEnd;
            lyricsSandbox.value = lyricsSandbox.value.substring(0, start) + fxText + lyricsSandbox.value.substring(end);
            lyricsSandbox.selectionStart = lyricsSandbox.selectionEnd = start + fxText.length;
            lyricsSandbox.focus();

        } catch (error) {
            console.error('Error generating vocal FX:', error);
            alert('Fehler bei der Effekt-Generierung. Bitte versuchen Sie es erneut.');
        } finally {
            generateDoublerFxBtn.removeAttribute('disabled');
            if(btnText) btnText.textContent = 'Doubler & FX hinzufügen';
        }
    };

    generateDoublerFxBtn.addEventListener('click', generateVocalDoubleAndFx);


    // --- AI Architect Logic ---
    const setAILoadingState = (isLoading: boolean) => {
        if (isLoading) {
            createStructureBtn.setAttribute('disabled', 'true');
            spinner.classList.remove('hidden');
            icon.classList.add('hidden');
            btnText.textContent = 'Erstelle Struktur...';
            aiFeedback.textContent = '';
        } else {
            createStructureBtn.removeAttribute('disabled');
            spinner.classList.add('hidden');
            icon.classList.remove('hidden');
            btnText.textContent = 'Struktur erstellen';
        }
    };

    const createStructure = async () => {
        const lyrics = lyricsSandbox.value.trim();
        let styles = stylesSandbox.value.trim();

        if (profiModeToggle.checked) {
            const profiStyleData: { [key: string]: string | number } = {};
            if (profiGenre.value) profiStyleData.genre = profiGenre.value;
            if (profiBpm.value) profiStyleData.bpm = parseInt(profiBpm.value, 10);
            if (profiKey.value) profiStyleData.key = profiKey.value;
            if (profiMood.value) profiStyleData.mood = profiMood.value;
            if (profiInstruments.value) profiStyleData.instruments = profiInstruments.value;
            if (profiVocalsProd.value) profiStyleData.vocals_and_production = profiVocalsProd.value;
            
            styles = `--- PROFI-MODUS STYLES ---\n${JSON.stringify(profiStyleData, null, 2)}`;
        }

        if (!lyrics && !styles) {
            aiFeedback.textContent = 'Bitte gib Lyrics oder Styles ein.';
            return;
        }

        setAILoadingState(true);
        clearAndHideFinalPrompt();

        try {
            const systemInstruction = `You are an expert 'Suno AI Song Architect' and a musical co-producer. Your primary goal is to combine a user's potentially fragmented lyrics, structural ideas, and style descriptions into a single, cohesive, and professionally structured prompt ready for Suno AI. You MUST generate a complete song blueprint.

**INPUT FORMAT:**
You will receive "Lyrics & Structure" and "Styles". The "Styles" input can be one of two formats:
1.  **Free-form Text:** A general description of the desired sound.
2.  **Profi-Modus (JSON):** A structured, JSON-like object providing specific musical parameters. It will be clearly marked with '--- PROFI-MODUS STYLES ---'.

**CRITICAL RULES:**

1.  **Combine Inputs:** Merge the "Lyrics & Structure" and "Styles" inputs intelligently.
    *   **If you receive Profi-Modus JSON:** You MUST translate the structured key-value pairs into a fluid, descriptive, narrative paragraph. For example, \`{"genre": "deep house", "bpm": 120, "mood": "groovy"}\` should become something like: "A groovy deep house track with a tempo of 120 BPM...". THIS NARRATIVE DESCRIPTION BECOMES THE CORE STYLE PROMPT. Do not just output the JSON.
    *   Place lyrics within structural tags (\`[Verse]\`, etc.). Use the generated style narrative to flesh out musical details throughout the structure.
2.  **DJ-Friendly Structure:** ALWAYS begin with a \`[DJ Intro - 16 bars]\` and end with a \`[DJ Outro - 16 bars]\`. These sections must be purely instrumental and percussive. CRITICALLY, you must add an explicit \`[instrumental]\` tag to these sections to prevent the AI from singing the descriptions.
    *   **DJ Intro Example:** \`[DJ Intro - 16 bars]\\n[instrumental]\\n[bars 1-8: driving four-on-the-floor kick drum only]\\n[bars 9-16: add crisp 909 hi-hats and a subtle side-chained pad swell]\`
    *   **DJ Outro Example:** \`[DJ Outro - 16 bars]\\n[instrumental]\\n[bars 1-8: strip down to kick, hi-hats, and bassline]\\n[bars 9-16: kick and hi-hats only, then fade out]\`
3.  **Detailed Musical Events:** Do not just list tags. Describe what happens musically within each section. Add bar counts (e.g., \`[Verse 1 - 16 bars]\`). Detail instrumentation, effects (filters, reverb), and dynamic changes.
    *   **Good Example:** \`[Verse 1 - 16 bars]\\n[soulful female vocals enter]\\n[warm analog synth pads]\\n[deep pulsating sub bassline]\\n[subtle filtered disco samples]\\nHere are the actual lyrics for the verse.\`
4.  **Logical Flow:** If the user provides a minimal structure (e.g., just a verse and chorus), build a complete, logical song around it (Intro -> Verse -> Pre-Chorus -> Chorus -> Verse 2 -> Chorus -> Bridge -> Solo -> Chorus -> Outro).
5.  **Strict Bracket Formatting:** This is the most important rule.
    *   The FINAL output must be ONLY the complete prompt text. No explanations, no greetings, no markdown.
    *   Use square brackets \`[]\` for ALL structural tags (\`[Verse]\`), musical events (\`[guitar solo]\`), and descriptive instructions (\`[warm analog synth pads]\`).
    *   **CRITICAL:** Every single line that is NOT a lyric MUST be wrapped in its own \`[]\`. Do NOT write descriptive sentences without brackets.
    *   **Correct Example:**
        \`[Verse 1 - 16 bars]
        [soulful female vocals enter]
        [warm analog synth pads]
        The AI sings this actual lyric line.\`
    *   **Incorrect Example:**
        \`[Verse 1 - 16 bars]
        soulful female vocals enter,
        warm analog synth pads.
        The AI sings this actual lyric line.\`
    *   Do NOT use parentheses \`()\` for these tags.
6.  **Language:** Respond in the same language as the user's input (which will be German). All musical descriptions and structural tags should be in English, as Suno AI understands them best, but the lyrics themselves should remain in German if provided in German.
7.  **Empty Lyric Section Handling:** This is the most important rule. If a structural section (e.g., \`[Verse]\`, \`[Instrumental]\`, \`[Solo]\`, and ESPECIALLY \`[DJ Intro]\` and \`[DJ Outro]\`) contains musical descriptions but has NO corresponding user-provided lyrics, you MUST add a clear instrumental directive. The simplest and best tag is just \`[instrumental]\`. You can also use \`[instrumental melody carries the theme]\` or \`[synth solo]\`. This is CRITICAL to prevent the AI from incorrectly singing the musical descriptions. NEVER leave a section with only descriptions and no lyrics or explicit instrumental directive.`;
            
            const contents = `Here are the user's song components:\n\n--- LYRICS & STRUCTURE ---\n${lyrics}\n\n--- STYLES ---\n${styles}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            finalPromptOutput.value = response.text.trim();
            finalPromptContainer.classList.remove('hidden');
            finalPromptOutput.style.height = 'auto';
            finalPromptOutput.style.height = `${finalPromptOutput.scrollHeight}px`;

            const errors = debugPrompt(finalPromptOutput.value);
            displayDebugResults(errors);

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            aiFeedback.textContent = 'Fehler bei der KI-Anfrage. Bitte versuchen Sie es erneut.';
        } finally {
            setAILoadingState(false);
        }
    };

    createStructureBtn.addEventListener('click', createStructure);

    // --- PROMPT DEBUGGER LOGIC ---
    interface PromptError {
        lineNumber: number;
        lineContent: string;
        type: 'mismatched' | 'unbracketed_instruction';
        message: string;
    }

    const debugPrompt = (promptText: string): PromptError[] => {
        const errors: PromptError[] = [];
        const lines = promptText.split('\n');
        
        const instructionKeywords = [
            'solo', 'guitar', 'synth', 'bass', 'drum', 'kick', 'snare', 'hat', 'beat',
            'reverb', 'delay', 'echo', 'filter', 'fade', 'sweep', 'pad', 'arp',
            'instrumental', 'vocal', 'production', 'bpm', 'bars', 'chord', 'melody',
            'anthem', 'soaring', 'driving', 'powerful', 'outro', 'intro', 'verse',
            'chorus', 'bridge', 'drop', 'build-up', 'percussive'
        ];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;

            const lineNumber = index + 1;
            const startsWithBracket = trimmedLine.startsWith('[');
            const endsWithBracket = trimmedLine.endsWith(']');

            if (startsWithBracket && !endsWithBracket) {
                errors.push({
                    lineNumber,
                    lineContent: trimmedLine,
                    type: 'mismatched',
                    message: `Zeile ${lineNumber}: Öffnende Klammer '[' ohne schließende ']'.`
                });
            } else if (!startsWithBracket && endsWithBracket) {
                errors.push({
                    lineNumber,
                    lineContent: trimmedLine,
                    type: 'mismatched',
                    message: `Zeile ${lineNumber}: Schließende Klammer ']' ohne öffnende '['.`
                });
            } else if (!startsWithBracket && !endsWithBracket) {
                const lineLowerCase = trimmedLine.toLowerCase();
                const containsKeyword = instructionKeywords.some(keyword => lineLowerCase.includes(keyword));
                const wordCount = trimmedLine.split(/\s+/).length;

                if (containsKeyword && wordCount < 15) { 
                    errors.push({
                        lineNumber,
                        lineContent: trimmedLine,
                        type: 'unbracketed_instruction',
                        message: `Zeile ${lineNumber}: Mögliche Anweisung ohne Klammern: "${trimmedLine.substring(0, 40)}..."`
                    });
                }
            }
        });
        return errors;
    };

    const displayDebugResults = (errors: PromptError[]) => {
        if (!debuggerContainer || !debuggerTitle || !debuggerOutput || !fixPromptBtn) return;
        
        debuggerContainer.classList.remove('hidden');
        debuggerOutput.innerHTML = '';

        if (errors.length === 0) {
            debuggerTitle.textContent = 'Debugger-Prüfung: Alles in Ordnung!';
            debuggerTitle.className = 'text-lg font-semibold mb-3 text-emerald-400';
            debuggerOutput.innerHTML = '<p class="text-gray-400">Keine offensichtlichen Fehler in der Klammer-Struktur gefunden.</p>';
            fixPromptBtn.classList.add('hidden');
        } else {
            debuggerTitle.textContent = `Debugger-Prüfung: ${errors.length} Problem(e) gefunden`;
            debuggerTitle.className = 'text-lg font-semibold mb-3 text-red-400';
            errors.forEach(error => {
                const errorEl = document.createElement('p');
                errorEl.className = 'text-red-400 border-l-2 border-red-500 pl-2';
                errorEl.textContent = error.message;
                debuggerOutput.appendChild(errorEl);
            });
            fixPromptBtn.classList.remove('hidden');
        }
    };

    const fixPromptErrors = () => {
        if (!finalPromptOutput) return;
        const currentPrompt = finalPromptOutput.value;
        const errors = debugPrompt(currentPrompt);
        if (errors.length === 0) return;

        const lines = currentPrompt.split('\n');
        
        errors.forEach(error => {
            const lineIndex = error.lineNumber - 1;
            if (error.type === 'unbracketed_instruction') {
                lines[lineIndex] = `[${lines[lineIndex].trim()}]`;
            } else if (error.type === 'mismatched') {
                const trimmed = lines[lineIndex].trim();
                if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
                    lines[lineIndex] = `${trimmed}]`;
                } else if (!trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    lines[lineIndex] = `[${trimmed}`;
                }
            }
        });

        finalPromptOutput.value = lines.join('\n');
        const newErrors = debugPrompt(finalPromptOutput.value);
        displayDebugResults(newErrors);
    };

    fixPromptBtn?.addEventListener('click', fixPromptErrors);
});