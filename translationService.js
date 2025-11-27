/**
 * Translation Service for NyayaSetu
 * 
 * This service provides comprehensive Hindi translation capabilities for legal documents
 * and their summaries. It utilizes both a dictionary-based approach for common
 * legal terminology and the Google Generative AI API for more complex translations.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model
const getModel = async () => {
  // Use the model from environment variable, fallback to "gemini-pro" if not set
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";
  console.log(`Translation service using Gemini model: ${modelName}`);
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Comprehensive Hindi Legal Terms Dictionary
 * This dictionary contains common legal terms and their Hindi translations
 */
const hindiLegalDictionary = {
  // Legal document types
  "agreement": "समझौता",
  "contract": "अनुबंध",
  "deed": "विलेख",
  "affidavit": "शपथ पत्र",
  "petition": "याचिका",
  "memorandum": "ज्ञापन",
  "will": "वसीयत",
  "power of attorney": "मुख्तारनामा",
  "lease": "पट्टा",
  "license": "लाइसेंस",
  "certificate": "प्रमाणपत्र",
  "notice": "नोटिस",
  "summons": "समन",
  "warrant": "वारंट",
  "order": "आदेश",
  "judgment": "न्यायनिर्णय",
  "decree": "डिक्री",
  "injunction": "निषेधाज्ञा",

  // Legal entities and roles
  "plaintiff": "वादी",
  "defendant": "प्रतिवादी",
  "petitioner": "याचिकाकर्ता",
  "respondent": "प्रत्यर्थी",
  "applicant": "आवेदक",
  "appellant": "अपीलकर्ता",
  "witness": "गवाह",
  "advocate": "अधिवक्ता",
  "lawyer": "वकील",
  "judge": "न्यायाधीश",
  "magistrate": "मजिस्ट्रेट",
  "court": "न्यायालय",
  "tribunal": "अधिकरण",
  "party": "पक्षकार",
  "legal heir": "कानूनी वारिस",
  "executor": "निष्पादक",
  "guardian": "संरक्षक",
  "trustee": "न्यासी",
  
  // Legal concepts
  "rights": "अधिकार",
  "duties": "कर्तव्य",
  "liability": "दायित्व",
  "obligation": "बाध्यता",
  "jurisdiction": "अधिकारिता",
  "compensation": "मुआवजा",
  "damages": "हर्जाना",
  "penalty": "दंड",
  "fine": "जुर्माना",
  "interest": "ब्याज",
  "title": "हक",
  "property": "संपत्ति",
  "movable property": "चल संपत्ति",
  "immovable property": "अचल संपत्ति",
  "possession": "कब्जा",
  "ownership": "स्वामित्व",
  "inheritance": "विरासत",
  "succession": "उत्तराधिकार",
  
  // Legal actions and processes
  "appeal": "अपील",
  "hearing": "सुनवाई",
  "trial": "मुकदमा",
  "litigation": "मुकदमेबाजी",
  "prosecution": "अभियोजन",
  "investigation": "जांच",
  "arbitration": "मध्यस्थता",
  "mediation": "मध्यस्थता",
  "conciliation": "सुलह",
  "settlement": "निपटान",
  "adjournment": "स्थगन",
  "dismissal": "खारिज",
  "acquittal": "बरी",
  "conviction": "दोषसिद्धि",
  "sentence": "सजा",
  "bail": "जमानत",
  "probation": "परिवीक्षा",
  "parole": "पैरोल",
  
  // Contract terminology
  "offer": "प्रस्ताव",
  "acceptance": "स्वीकृति",
  "consideration": "प्रतिफल",
  "breach": "उल्लंघन",
  "default": "चूक",
  "termination": "समाप्ति",
  "renewal": "नवीनीकरण",
  "amendment": "संशोधन",
  "clause": "खंड",
  "condition": "शर्त",
  "warranty": "वारंटी",
  "indemnity": "क्षतिपूर्ति",
  "force majeure": "अप्रत्याशित घटना",
  "void": "शून्य",
  "voidable": "शून्यकरणीय",
  "validity": "वैधता",
  "execution": "निष्पादन",
  "performance": "पालन",
  
  // Property law terms
  "land": "भूमि",
  "building": "भवन",
  "premises": "परिसर",
  "tenant": "किरायेदार",
  "landlord": "मकान मालिक",
  "rent": "किराया",
  "mortgage": "बंधक",
  "hypothecation": "दृष्टिबंधक",
  "lien": "धारणाधिकार",
  "easement": "सुविधाधिकार",
  "encumbrance": "भार",
  "sale": "बिक्री",
  "purchase": "खरीद",
  "conveyance": "हस्तांतरण",
  "gift": "दान",
  "partition": "विभाजन",
  
  // Criminal law terms
  "offence": "अपराध",
  "crime": "अपराध",
  "accused": "अभियुक्त",
  "charge": "आरोप",
  "complaint": "शिकायत",
  "evidence": "साक्ष्य",
  "testimony": "गवाही",
  "cross-examination": "प्रतिपरीक्षा",
  "confession": "इकबालिया बयान",
  "arrest": "गिरफ्तारी",
  "custody": "हिरासत",
  "detention": "नजरबंदी",
  "punishment": "सज़ा",
  "imprisonment": "कैद",
  
  // Commercial law terms
  "company": "कंपनी",
  "corporation": "निगम",
  "partnership": "साझेदारी",
  "firm": "फर्म",
  "director": "निदेशक",
  "shareholder": "शेयरधारक",
  "dividend": "लाभांश",
  "capital": "पूंजी",
  "assets": "परिसंपत्तियां",
  "liabilities": "देनदारियां",
  "bankruptcy": "दिवालियापन",
  "insolvency": "ऋणशोधन अक्षमता",
  "liquidation": "परिसमापन",
  "winding up": "समापन",
  "merger": "विलय",
  "acquisition": "अधिग्रहण",
  "takeover": "अधिग्रहण",
  
  // Procedural terms
  "application": "आवेदन",
  "motion": "प्रार्थना",
  "submission": "प्रस्तुति",
  "pleading": "अभिवचन",
  "plaint": "वादपत्र",
  "written statement": "लिखित बयान",
  "rejoinder": "प्रत्युत्तर",
  "replication": "प्रत्युत्तर",
  "affirmation": "प्रतिज्ञान",
  "verification": "सत्यापन",
  "attestation": "अनुप्रमाणन",
  "registration": "पंजीकरण",
  "filing": "दाखिल",
  "admissible": "ग्राह्य",
  "inadmissible": "अग्राह्य",
  
  // Temporal terms
  "date": "तारीख",
  "day": "दिन",
  "month": "महीना",
  "year": "वर्ष",
  "time period": "समयावधि",
  "deadline": "समय सीमा",
  "statute of limitations": "परिसीमा विधि",
  "limitation period": "परिसीमा अवधि",
  
  // Document sections
  "section": "धारा",
  "article": "अनुच्छेद",
  "rule": "नियम",
  "regulation": "विनियम",
  "schedule": "अनुसूची",
  "annexure": "अनुलग्नक",
  "appendix": "परिशिष्ट",
  "chapter": "अध्याय",
  "part": "भाग",
  "paragraph": "पैराग्राफ",
  "page": "पृष्ठ",
  
  // Summary specific terms
  "document overview": "दस्तावेज़ अवलोकन",
  "key parties": "मुख्य पक्षकार",
  "important clauses": "महत्वपूर्ण खंड",
  "obligations": "बाध्यताएं",
  "critical dates": "महत्वपूर्ण तिथियां",
  "potential concerns": "संभावित चिंताएं",
  "plain language summary": "सरल भाषा सारांश",
  
  // Additional terms for comprehensive coverage
  "statute": "विधि",
  "law": "कानून",
  "act": "अधिनियम",
  "legislation": "विधान",
  "amendment": "संशोधन",
  "constitution": "संविधान",
  "fundamental rights": "मौलिक अधिकार",
  "directive principles": "निर्देशक सिद्धांत",
  "legal representation": "विधिक प्रतिनिधित्व",
  "legal advice": "विधिक सलाह",
  "legal opinion": "विधिक राय",
  "legal procedure": "विधिक प्रक्रिया",
  "jurisdiction": "अधिकार क्षेत्र",
  "legal remedy": "कानूनी उपचार",
  "jurisdiction": "न्यायिक क्षेत्राधिकार",
  "governing law": "शासी कानून",
  "applicable law": "लागू कानून",
  "jurisdiction clause": "अधिकारिता खंड",
  "dispute resolution": "विवाद समाधान",
  "severability": "पृथक्करणीयता",
  "confidentiality": "गोपनीयता",
  "non-disclosure": "गैर-प्रकटीकरण",
  "assignment": "समनुदेशन",
  "delegation": "प्रत्यायोजन",
  "intellectual property": "बौद्धिक संपदा",
  "copyright": "प्रतिलिप्याधिकार",
  "trademark": "व्यापार चिन्ह",
  "patent": "पेटेंट",
  "representation": "अभ्यावेदन",
  "misrepresentation": "मिथ्या प्रस्तुति",
  "fraud": "धोखाधड़ी",
  "duress": "दबाव",
  "undue influence": "अनुचित प्रभाव",
  "mistake": "गलती",
  "discharge": "निर्वहन",
  "frustration": "निष्फलता",
  "quantum meruit": "जितना किया उतना मिले",
  "specific performance": "विशिष्ट पालन",
  "injunction": "व्यादेश",
  "declaratory relief": "घोषणात्मक राहत",
  "limitation": "परिसीमा",
  "cause of action": "वाद हेतु",
  "locus standi": "अधिकारिता",
  "prima facie": "प्रथम दृष्टया",
  "beyond reasonable doubt": "उचित संदेह से परे",
  "burden of proof": "सबूत का भार",
  "preponderance of evidence": "साक्ष्य का प्राबल्य"
};

/**
 * Translate a single term using the dictionary
 * @param {string} term - The English term to translate
 * @returns {string} The Hindi translation if available, otherwise the original term
 */
const translateTerm = (term) => {
  if (!term) return '';
  
  // Convert to lowercase for dictionary lookup
  const lowercaseTerm = term.toLowerCase();
  
  // Check if the exact term exists in the dictionary
  if (hindiLegalDictionary[lowercaseTerm]) {
    return hindiLegalDictionary[lowercaseTerm];
  }
  
  // Check for partial matches (for compound terms)
  const words = lowercaseTerm.split(' ');
  if (words.length > 1) {
    const translatedWords = words.map(word => {
      return hindiLegalDictionary[word] || word;
    });
    return translatedWords.join(' ');
  }
  
  // Return the original term if no translation found
  return term;
};

/**
 * Translate a string with multiple terms using the dictionary
 * For more complex phrases, tries to match known legal terms
 * @param {string} text - The English text to translate
 * @returns {string} The Hindi translation with terms replaced
 */
const translateText = (text) => {
  if (!text) return '';
  
  let translatedText = text;
  
  // First try to translate multi-word terms (to avoid partial replacements)
  Object.keys(hindiLegalDictionary)
    .filter(term => term.includes(' '))
    .sort((a, b) => b.length - a.length) // Sort by length descending to handle longer phrases first
    .forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      translatedText = translatedText.replace(regex, hindiLegalDictionary[term]);
    });
  
  // Then translate single-word terms
  Object.keys(hindiLegalDictionary)
    .filter(term => !term.includes(' '))
    .sort((a, b) => b.length - a.length) // Sort by length descending
    .forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      translatedText = translatedText.replace(regex, hindiLegalDictionary[term]);
    });
  
  return translatedText;
};

/**
 * Translate complex text using Google Generative AI
 * This is used for translating longer paragraphs or complex sentences
 * @param {string} text - The English text to translate
 * @param {boolean} enforceComplete - Whether to enforce 100% translation and retry until no English remains
 * @returns {Promise<string>} The Hindi translation
 */
const translateWithAI = async (text, enforceComplete = true) => {
  try {
    const geminiModel = await getModel();
    
    // Define examples of fully translated text pairs to guide the model
    const fewShotExamples = [
      {
        english: "This document is a sample draft of a legal document based on India's Protection of Women from Domestic Violence Act, 2005.",
        hindi: "यह दस्तावेज़ भारत के महिलाओं का घरेलू हिंसा से संरक्षण अधिनियम, 2005 पर आधारित एक कानूनी दस्तावेज़ का नमूना प्रारूप है।"
      },
      {
        english: "The complainant is the individual alleging domestic violence, seeking protection and relief under the Act.",
        hindi: "शिकायतकर्ता वह व्यक्ति है जो घरेलू हिंसा का आरोप लगा रहा है और अधिनियम के तहत संरक्षण और राहत की मांग कर रहा है।"
      },
      {
        english: "This section prohibits the respondent from committing any further acts of domestic violence against the complainant.",
        hindi: "यह खंड प्रतिवादी को शिकायतकर्ता के विरुद्ध घरेलू हिंसा के किसी भी अतिरिक्त कृत्य को करने से रोकता है।"
      }
    ];
    
    // Create a more comprehensive and instructional prompt with examples
    const prompt = `
    TASK: Translate the following English legal text to Hindi with 100% accuracy and completeness.
    
    ### ABSOLUTE MANDATORY REQUIREMENTS:
    1. TRANSLATE EVERY SINGLE WORD into Hindi - NO EXCEPTIONS and NO ENGLISH WORDS should remain
    2. ALL common English words (the, and, for, to, with, from, this, that, etc.) MUST be translated to Hindi
    3. ALL legal terms MUST be translated to formal Hindi legal terminology
    4. Legal terms like "Protection Order", "Residence Order", "Interim Orders", "Complainant" MUST be translated
    5. ALL technical terms MUST have Hindi equivalents - do NOT keep any English technical terms
    6. ALL names, dates, and numbers MUST also be properly transliterated to Hindi
    7. NO special characters (*#_~\`) or formatting should be included
    8. Your output MUST contain ONLY Devanagari script (Hindi characters) with ABSOLUTELY NO Latin alphabet
    9. Maintain paragraph and sentence structure in your translation
    10. TRIPLE CHECK your output to ensure NO English words remain
    
    ### EXAMPLES OF COMPLETE HINDI TRANSLATIONS:
    
    ENGLISH: "${fewShotExamples[0].english}"
    HINDI: "${fewShotExamples[0].hindi}"
    
    ENGLISH: "${fewShotExamples[1].english}"
    HINDI: "${fewShotExamples[1].hindi}"
    
    ENGLISH: "${fewShotExamples[2].english}"
    HINDI: "${fewShotExamples[2].hindi}"
    
    ### TEXT TO TRANSLATE:
    "${text}"
    
    ### पूर्ण हिंदी अनुवाद (100% शब्द हिंदी में, बिना किसी अंग्रेजी शब्द के):
    `;
    
    // More aggressive generation config to ensure complete translation
    const generationConfig = {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    // First pass translation
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      generationConfig
    });
    
    const response = await result.response;
    let translatedText = response.text();
    
    // Cleanup special characters and prefixes
    translatedText = translatedText.replace(/[*#_~`]/g, '');
    translatedText = translatedText.replace(/^(translation|hindi translation|translated text|hindi:|अनुवाद:):\s*/i, '');
    
    // If we need to enforce complete translation
    if (enforceComplete) {
      // More comprehensive check for English words - look for Latin characters in words
      let hasEnglishWords = /[a-zA-Z]{3,}/.test(translatedText);
      
      // Extract English words for detailed reporting
      const englishWords = (translatedText.match(/[a-zA-Z]{3,}/g) || [])
        .filter((value, index, self) => self.indexOf(value) === index);
      
      if (hasEnglishWords) {
        console.log(`Initial translation contains ${englishWords.length} English words: ${englishWords.join(', ')}`);
      }
      
      // Attempt up to 5 passes to eliminate all English (increased from 3)
      let attempts = 0;
      
      while (hasEnglishWords && attempts < 5) {
        attempts++;
        console.log(`Detected English words in translation, attempting pass #${attempts+1}`);
        
        // Build a more targeted prompt for remaining English words with specific identification
        const currentEnglishWords = (translatedText.match(/[a-zA-Z]{3,}/g) || [])
          .filter((value, index, self) => self.indexOf(value) === index);
          
        const refinementPrompt = `
        CRITICAL TASK: This Hindi text still contains ${currentEnglishWords.length} English words that MUST be translated to Hindi:
        
        ### Text with English words:
        "${translatedText}"
        
        ### Specific English words to translate:
        ${currentEnglishWords.map(word => `- "${word}"`).join('\n')}
        
        ### ABSOLUTE REQUIREMENTS:
        1. REPLACE ALL ENGLISH WORDS with Hindi translations
        2. DO NOT change any existing Hindi text
        3. Your output MUST be 100% in Devanagari script only
        4. DO NOT explain or add any commentary
        5. Return ONLY the complete corrected Hindi text
        6. Make sure to translate ALL instances of the listed English words
        
        ### पूर्ण हिंदी अनुवाद (बिना किसी अंग्रेजी शब्द के):
        `;
        
        try {
          const refinementResult = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: refinementPrompt }]}],
            generationConfig: { ...generationConfig, temperature: 0.2 }
          });
          
          const refinementResponse = await refinementResult.response;
          const refinedText = refinementResponse.text();
          
          // Apply cleanup again
          translatedText = refinedText
            .replace(/[*#_~`]/g, '')
            .replace(/^(translation|hindi translation|translated text|hindi:|अनुवाद:):\s*/i, '');
          
          // Check if we've eliminated all English
          hasEnglishWords = /[a-zA-Z]{3,}/.test(translatedText);
          
          if (!hasEnglishWords) {
            console.log(`Successfully eliminated all English words after ${attempts+1} passes`);
            break;
          }
          
          // If still has English words, log them for debugging
          const remainingEnglishWords = (translatedText.match(/[a-zA-Z]{3,}/g) || [])
            .filter((value, index, self) => self.indexOf(value) === index);
            
          console.log(`After pass ${attempts+1}, still have ${remainingEnglishWords.length} English words: ${remainingEnglishWords.join(', ')}`);
          
        } catch (refinementError) {
          console.error('Error in refinement pass:', refinementError);
          break;
        }
      }
      
      // If we still have English words, try one last targeted approach with contextual translation
      if (/[a-zA-Z]{3,}/.test(translatedText)) {
        console.log("Applying final targeted translation for remaining English words");
        
        // Extract just the English words to translate them specifically
        const englishWordsMatch = translatedText.match(/[a-zA-Z]{3,}|[A-Z][a-z]{2,}/g) || [];
        const englishWords = [...new Set(englishWordsMatch)]; // Remove duplicates
        
        if (englishWords.length > 0) {
          try {
            // First, get a word-for-word translation for each term
            const termsPrompt = `
            Translate ONLY these specific English terms to Hindi with highest accuracy:
            ${englishWords.map(word => `- ${word}`).join('\n')}
            
            Format your response as a simple list of Hindi translations only, one term per line.
            DO NOT include any English words, explanations, or bullet points in your response.
            `;
            
            const termsResult = await geminiModel.generateContent({
              contents: [{ role: "user", parts: [{ text: termsPrompt }]}],
              generationConfig: { temperature: 0.1 }
            });
            
            const termsResponse = await termsResult.response;
            const translations = termsResponse.text()
              .split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.replace(/^[-•*]\s+/, '').trim());
            
            // If we got the translations, apply them to the text
            if (translations.length > 0) {
              console.log(`Got ${translations.length} translations for ${englishWords.length} words`);
              
              // Create a mapping of English to Hindi terms
              const translationMap = {};
              for (let i = 0; i < Math.min(englishWords.length, translations.length); i++) {
                translationMap[englishWords[i]] = translations[i];
              }
              
              // Now create a more context-aware substitution request
              const contextSubstitutionPrompt = `
              TASK: Replace ALL instances of these English words with their Hindi translations in this text:
              
              TEXT: "${translatedText}"
              
              TRANSLATIONS TO APPLY:
              ${Object.entries(translationMap).map(([eng, hin]) => `"${eng}" => "${hin}"`).join('\n')}
              
              REQUIREMENTS:
              1. Return the COMPLETE text with ALL English words replaced
              2. Preserve ALL existing Hindi text exactly as is
              3. Make substitutions in context to ensure proper grammar
              4. Output ONLY the final Hindi text with NO explanations
              `;
              
              const contextResult = await geminiModel.generateContent({
                contents: [{ role: "user", parts: [{ text: contextSubstitutionPrompt }]}],
                generationConfig: { temperature: 0.1 }
              });
              
              const contextResponse = await contextResult.response;
              let finalText = contextResponse.text()
                .replace(/[*#_~`]/g, '')
                .replace(/^(translation|hindi translation|translated text|hindi:|अनुवाद:):\s*/i, '');
              
              // If we still have English words, do a direct word-by-word replacement as fallback
              if (/[a-zA-Z]{3,}/.test(finalText)) {
                console.log("Context-aware replacement still has English words, falling back to direct replacement");
                let directReplacementText = translatedText;
                for (let i = 0; i < englishWords.length; i++) {
                  if (translations[i] && translations[i].trim() && !/[a-zA-Z]{3,}/.test(translations[i])) {
                    // Create a regex that handles word boundaries to avoid partial replacements
                    const wordRegex = new RegExp(`\\b${englishWords[i]}\\b`, 'g');
                    directReplacementText = directReplacementText.replace(wordRegex, translations[i]);
                  }
                }
                
                // Only use the direct replacement if it reduced the English word count
                const originalEnglishCount = (translatedText.match(/[a-zA-Z]{3,}/g) || []).length;
                const newEnglishCount = (directReplacementText.match(/[a-zA-Z]{3,}/g) || []).length;
                
                if (newEnglishCount < originalEnglishCount) {
                  translatedText = directReplacementText;
                  console.log(`Reduced English words from ${originalEnglishCount} to ${newEnglishCount}`);
                }
              } else {
                translatedText = finalText;
                console.log("Context-aware replacement successful");
              }
            }
          } catch (termsError) {
            console.error('Error in term-by-term translation:', termsError);
          }
        }
      }
    }
    
    return translatedText;
  } catch (error) {
    console.error('Error translating with AI:', error);
    // Fallback to dictionary-based translation
    return translateText(text);
  }
};

/**
 * Translate an array of strings
 * @param {Array<string>} items - Array of strings to translate
 * @param {boolean} useAI - Whether to use AI for translation
 * @returns {Promise<Array<string>>} Array of translated strings
 */
const translateArray = async (items, useAI = false) => {
  if (!items || !Array.isArray(items)) return [];
  
  if (useAI) {
    const translatedItems = [];
    // Process items in batches to avoid overloading the API
    for (const item of items) {
      const translatedItem = await translateWithAI(item);
      translatedItems.push(translatedItem);
    }
    return translatedItems;
  } else {
    return items.map(item => translateText(item));
  }
};

/**
 * Translate an object's string values
 * @param {Object} obj - Object with string values to translate
 * @param {boolean} useAI - Whether to use AI for translation
 * @returns {Promise<Object>} Object with translated values
 */
const translateObject = async (obj, useAI = false) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = useAI ? await translateWithAI(value) : translateText(value);
    } else if (Array.isArray(value)) {
      result[key] = await translateArray(value, useAI);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, useAI);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Translate an object completely to Hindi, including keys and values
 * @param {Object} obj - Object with string values to translate
 * @param {boolean} enforceComplete - Whether to ensure 100% Hindi translation
 * @returns {Promise<Object>} Object with both keys and values translated
 */
const translateObjectComplete = async (obj, enforceComplete = true) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const result = {};
  
  // First translate all the keys
  const keyPromises = Object.keys(obj).map(async (key) => {
    // Don't translate keys that are already in Hindi
    const isHindiKey = /[\u0900-\u097F]/.test(key);
    if (isHindiKey) {
      return { originalKey: key, translatedKey: key };
    }
    const translatedKey = await translateWithAI(key, enforceComplete);
    return { originalKey: key, translatedKey };
  });
  
  const translatedKeys = await Promise.all(keyPromises);
  
  // Then process values for each key
  for (const { originalKey, translatedKey } of translatedKeys) {
    const value = obj[originalKey];
    
    if (typeof value === 'string') {
      result[translatedKey] = await translateWithAI(value, enforceComplete);
    } else if (Array.isArray(value)) {
      // Translate each item in the array
      result[translatedKey] = await Promise.all(value.map(item => 
        typeof item === 'string' ? 
          translateWithAI(item, enforceComplete) : 
          item
      ));
    } else if (typeof value === 'object' && value !== null) {
      result[translatedKey] = await translateObjectComplete(value, enforceComplete);
    } else {
      result[translatedKey] = value;
    }
  }
  
  return result;
};

/**
 * Translate a document summary to Hindi
 * @param {Object} summary - The document summary object
 * @param {boolean} useAI - Whether to use AI for complex translations
 * @param {boolean} enforceComplete - Whether to ensure 100% translation with no English words
 * @returns {Promise<Object>} Translated summary object
 */
const translateSummary = async (summary, useAI = false, enforceComplete = true) => {
  if (!summary) return null;
  
  try {
    // Always use AI for complete, word-by-word translation regardless of the useAI parameter
    const shouldUseAI = true; // Force AI translation for complete results
    
    console.log(`Translating summary with enforceComplete=${enforceComplete}`);
    
    const translatedSummary = {
      documentOverview: shouldUseAI 
        ? await translateWithAI(summary.documentOverview, enforceComplete)
        : translateText(summary.documentOverview),
      
      keyParties: await Promise.all((summary.keyParties || []).map(item => 
        translateWithAI(item, enforceComplete)
      )),
      
      importantClauses: await Promise.all((summary.importantClauses || []).map(item => 
        translateWithAI(item, enforceComplete)
      )),
      
      obligations: await translateObjectComplete(summary.obligations || {}, enforceComplete),
      
      criticalDates: await Promise.all((summary.criticalDates || []).map(item => 
        translateWithAI(item, enforceComplete)
      )),
      
      potentialConcerns: await Promise.all((summary.potentialConcerns || []).map(item => 
        translateWithAI(item, enforceComplete)
      )),
      
      plainLanguageSummary: shouldUseAI
        ? await translateWithAI(summary.plainLanguageSummary, enforceComplete)
        : translateText(summary.plainLanguageSummary)
    };
    
    // Additional cleanup to ensure no special characters remain in any fields
    const cleanupSpecialChars = (text) => {
      if (typeof text === 'string') {
        return text.replace(/[*#_~`]/g, '');
      }
      return text;
    };
    
    // Clean up all string fields
    translatedSummary.documentOverview = cleanupSpecialChars(translatedSummary.documentOverview);
    translatedSummary.keyParties = translatedSummary.keyParties.map(cleanupSpecialChars);
    translatedSummary.importantClauses = translatedSummary.importantClauses.map(cleanupSpecialChars);
    translatedSummary.criticalDates = translatedSummary.criticalDates.map(cleanupSpecialChars);
    translatedSummary.potentialConcerns = translatedSummary.potentialConcerns.map(cleanupSpecialChars);
    translatedSummary.plainLanguageSummary = cleanupSpecialChars(translatedSummary.plainLanguageSummary);
    
    // Clean obligations object
    if (translatedSummary.obligations) {
      Object.keys(translatedSummary.obligations).forEach(party => {
        const cleanParty = cleanupSpecialChars(party);
        if (party !== cleanParty) {
          translatedSummary.obligations[cleanParty] = translatedSummary.obligations[party];
          delete translatedSummary.obligations[party];
        }
        if (Array.isArray(translatedSummary.obligations[cleanParty])) {
          translatedSummary.obligations[cleanParty] = translatedSummary.obligations[cleanParty].map(cleanupSpecialChars);
        }
      });
    }
    
    return translatedSummary;
  } catch (error) {
    console.error('Error translating summary:', error);
    return summary;
  }
};

module.exports = {
  translateTerm,
  translateText,
  translateWithAI,
  translateArray,
  translateObject,
  translateObjectComplete,
  translateSummary,
  hindiLegalDictionary,
  getModel
};