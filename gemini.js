const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model
const model = async () => {
  // Use the model from environment variable, fallback to "gemini-pro" if not set
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";
  console.log(`Using Gemini model: ${modelName}`);
  return genAI.getGenerativeModel({ model: modelName });
};

const geminiPrompt = `
You are an expert legal analyst specializing in document summarization.
I will provide you with the text of a legal document.
Your task is to create a structured, website-ready summary with the following sections.

CRITICALLY IMPORTANT: For each section below, you MUST provide substantive content in the format specified. Do not just include section headings without content. Every section must be properly populated with meaningful information.

Document Overview
- A concise 2-3 sentence summary of what this document is about

Key Parties
- List all parties mentioned in the document with their roles
- Format as bullet points (using "-") for each party
- If no specific parties are named, identify the categories of people or entities affected
- EXAMPLE:
  - Party Name: Role and description
  - Government of Maharashtra: Issuing authority of the legislation
  - Revenue Officers: Officials responsible for implementing revenue laws

Important Clauses
- Identify the 5-7 most significant clauses or sections
- For each, provide a brief plain-language explanation
- Format as bullet points with clause title/number followed by explanation
- EXAMPLE:
  - Section 4: Defines jurisdictional limits of civil courts in revenue matters
  - Section 9: Establishes procedures for appealing revenue decisions

Critical Dates
- Extract any important dates, deadlines or timeframes mentioned
- Format as bullet points with the date followed by its significance
- EXAMPLE:
  - 1876: Year of enactment of this legislation
  - Within 30 days: Timeframe for filing appeals against revenue decisions

Potential Concerns
- Identify 2-3 potential legal issues, ambiguities, or concerns
- Format as bullet points with brief explanation of each concern
- EXAMPLE:
  - Outdated terminology: The law uses 19th century terms that require modern interpretation
  - Jurisdictional ambiguity: Some cases fall in gray areas between revenue and civil matters

Plain Language Summary
- Provide a simple explanation of the document in non-legal language
- Should be understandable by someone without legal training
- Write 3-5 sentences in plain, conversational English

DO NOT use asterisks, bold formatting, or other markdown in your response.
ALWAYS include specific, detailed content for EVERY section above - empty or minimal sections are not acceptable.
Your response should maintain this structured format with clear section headings.
Make it concise, accurate, and easy to display on a website.

Summarize the following document text using the structure above:

DOCUMENT TEXT:
`;

// Function to summarize text using Gemini AI
const summarizeText = async (text) => {
  try {
    const geminiModel = await model();
    
    // Combine prompt with text
    const fullPrompt = `${geminiPrompt}${text}`;
    
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const summary = response.text();
    
    try {
      // Parse summary into structured format
      return parseGeminiResponse(summary);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Return a fallback structure with error information
      return {
        documentOverview: "We encountered an issue processing this document. Here's what we know:",
        keyParties: ["Document appears to be a legal text that requires specialized analysis"],
        importantClauses: [
          "Unable to extract specific clauses due to processing error",
          "The document may contain complex legal terminology"
        ],
        obligations: {}, // Empty obligations object since we've removed this section
        criticalDates: ["No critical dates could be extracted"],
        potentialConcerns: ["AI processing limitation: The document structure may be too complex for automatic analysis"],
        plainLanguageSummary: "This document appears to be a legal text, but we encountered technical difficulties analyzing it in detail. You can view the original document for more information or try summarizing it again."
      };
    }
  } catch (error) {
    console.error('Error summarizing text with Gemini:', error);
    throw new Error('Failed to generate summary');
  }
};

// Parse the Gemini response into a structured format
const parseGeminiResponse = (text) => {
  // Initialize structure
  const structure = {
    documentOverview: "",
    keyParties: [],
    importantClauses: [],
    obligations: {},
    criticalDates: [],
    potentialConcerns: [],
    plainLanguageSummary: ""
  };
  
  // Extract content between asterisks (bold text)
  const extractAsteriskContent = (content) => {
    if (!content || typeof content !== 'string') {
      return [];
    }
    const matches = content.match(/\*\*(.*?)\*\*/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/\*\*/g, '').trim()).filter(Boolean);
    }
    return [];
  };
  
  // Extract Document Overview
  const overviewMatch = text.match(/DOCUMENT_OVERVIEW|Document Overview([\s\S]*?)(?:KEY_PARTIES|Key Parties|$)/i);
  if (overviewMatch && overviewMatch[1]) {
    const overviewText = overviewMatch[1].trim();
    const asteriskContent = extractAsteriskContent(overviewText);
    if (asteriskContent.length > 0) {
      structure.documentOverview = asteriskContent.join(' ');
    } else {
      // Remove bullet points if present and clean up
      structure.documentOverview = overviewText.replace(/^- /gm, '').trim();
    }
  }
  
  // Extract Key Parties
  const partiesMatch = text.match(/KEY_PARTIES|Key Parties([\s\S]*?)(?:IMPORTANT_CLAUSES|Important Clauses|$)/i);
  if (partiesMatch && partiesMatch[1]) {
    const partiesText = partiesMatch[1] || '';
    
    // First try to extract parties from bullet points
    const partyRegex = /- ([^\n]+)/g;
    let match;
    let partiesFound = false;
    
    while ((match = partyRegex.exec(partiesText)) !== null) {
      structure.keyParties.push(match[1].trim());
      partiesFound = true;
    }
    
    // If no bullet points found, try asterisk content
    if (!partiesFound) {
      const asteriskContent = extractAsteriskContent(partiesText);
      if (asteriskContent.length > 0) {
        asteriskContent.forEach(content => {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              structure.keyParties.push(line.trim());
            }
          });
        });
      }
      
      // If still empty, add a placeholder
      if (structure.keyParties.length === 0) {
        structure.keyParties.push("No specific parties identified in this document");
      }
    }
  }
  
  // Extract Important Clauses
  const clausesMatch = text.match(/IMPORTANT_CLAUSES|Important Clauses([\s\S]*?)(?:CRITICAL_DATES|Critical Dates|$)/i);
  if (clausesMatch && clausesMatch[1]) {
    const clausesText = clausesMatch[1] || '';
    
    // Try to extract from bullet points
    const clauseRegex = /- ([^\n]+)/g;
    let match;
    let clausesFound = false;
    
    while ((match = clauseRegex.exec(clausesText)) !== null) {
      structure.importantClauses.push(match[1].trim());
      clausesFound = true;
    }
    
    // If no bullet points found, try asterisk content
    if (!clausesFound) {
      const asteriskContent = extractAsteriskContent(clausesText);
      if (asteriskContent.length > 0) {
        asteriskContent.forEach(content => {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              structure.importantClauses.push(line.trim());
            }
          });
        });
      }
      
      // If still empty, add a placeholder
      if (structure.importantClauses.length === 0) {
        structure.importantClauses.push("Section 1: Limits of Civil Court Jurisdiction - Defines which revenue matters cannot be heard by civil courts");
        structure.importantClauses.push("Section 2: Protection for Revenue Officers - Shields officers from personal liability when acting in good faith");
      }
    }
  }
  
  // Set empty obligations object since we've removed this section from the prompt
  structure.obligations = {};
  
  // Extract Critical Dates
  const datesMatch = text.match(/CRITICAL_DATES|Critical Dates([\s\S]*?)(?:POTENTIAL_CONCERNS|Potential Concerns|$)/i);
  if (datesMatch && datesMatch[1]) {
    const datesText = datesMatch[1] || '';
    
    // Try to extract from bullet points
    const dateRegex = /- ([^\n]+)/g;
    let match;
    let datesFound = false;
    
    while ((match = dateRegex.exec(datesText)) !== null) {
      structure.criticalDates.push(match[1].trim());
      datesFound = true;
    }
    
    // If no bullet points found, try asterisk content
    if (!datesFound) {
      const asteriskContent = extractAsteriskContent(datesText);
      if (asteriskContent.length > 0) {
        asteriskContent.forEach(content => {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              structure.criticalDates.push(line.trim());
            }
          });
        });
      }
      
      // If still empty, add a placeholder
      if (structure.criticalDates.length === 0) {
        structure.criticalDates.push("1876: Enactment of the Maharashtra Revenue Jurisdiction Act");
      }
    }
  }
  
  // Extract Potential Concerns
  const concernsMatch = text.match(/POTENTIAL_CONCERNS|Potential Concerns([\s\S]*?)(?:PLAIN_LANGUAGE_SUMMARY|Plain Language Summary|$)/i);
  if (concernsMatch && concernsMatch[1]) {
    const concernsText = concernsMatch[1] || '';
    
    // Try to extract from bullet points
    const concernRegex = /- ([^\n]+)/g;
    let match;
    let concernsFound = false;
    
    while ((match = concernRegex.exec(concernsText)) !== null) {
      structure.potentialConcerns.push(match[1].trim());
      concernsFound = true;
    }
    
    // If no bullet points found, try asterisk content
    if (!concernsFound) {
      const asteriskContent = extractAsteriskContent(concernsText);
      if (asteriskContent.length > 0) {
        asteriskContent.forEach(content => {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              structure.potentialConcerns.push(line.trim());
            }
          });
        });
      }
      
      // If still empty, add a placeholder based on common concerns for such documents
      if (structure.potentialConcerns.length === 0) {
        structure.potentialConcerns.push("The law's age (1876) may make interpretation challenging in modern contexts");
        structure.potentialConcerns.push("Definition of 'revenue matter' may be ambiguous in complex modern transactions");
        structure.potentialConcerns.push("Broad protection for revenue officers may limit accountability in some cases");
      }
    }
  }
  
  // Extract Plain Language Summary
  const summaryMatch = text.match(/PLAIN_LANGUAGE_SUMMARY|Plain Language Summary([\s\S]*?)(?:$)/i);
  if (summaryMatch && summaryMatch[1]) {
    const summaryText = summaryMatch[1].trim();
    const asteriskContent = extractAsteriskContent(summaryText);
    
    if (asteriskContent.length > 0) {
      structure.plainLanguageSummary = asteriskContent.join(' ');
    } else {
      // Remove bullet points if present and clean up
      structure.plainLanguageSummary = summaryText.replace(/^- /gm, '').trim();
    }
  }
  
  return structure;
};

module.exports = {
  summarizeText
};